import { Router, Request, Response } from 'express';
import { db } from '../../database/db.service.js';
import { getAuthUser } from '../auth/auth.router.js';
import { createFranchiseSchema } from '@anivault/validation';
import { FranchiseRollupCalculator, RollupComponent } from '@anivault/domain';
import {
  FranchiseTreeResponse,
  RelationshipType,
  MediaFormat,
  MediaType
} from '@anivault/shared-types';
import crypto from 'crypto';

const router = Router();

// List franchises
router.get('/', (req: Request, res: Response): void => {
  const search = ((req.query.search as string) || '').toLowerCase();
  let list = Array.from(db.franchises.values());

  if (search) {
    list = list.filter(
      (f) =>
        f.canonicalTitle.toLowerCase().includes(search) ||
        (f.originalTitle && f.originalTitle.toLowerCase().includes(search))
    );
  }

  res.json({ data: list, total: list.length });
});

// Create franchise
router.post('/', (req: Request, res: Response): void => {
  try {
    const validated = createFranchiseSchema.parse(req.body);
    const id = crypto.randomUUID();
    const newFranchise = {
      id,
      canonicalTitle: validated.canonicalTitle,
      originalTitle: validated.originalTitle || null,
      description: validated.description || null,
      bannerUrl: validated.bannerUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.franchises.set(id, newFranchise);
    res.status(201).json(newFranchise);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Full Franchise Tree
router.get('/:id', (req: Request, res: Response): void => {
  const franchiseId = req.params.id as string;
  const franchise = db.franchises.get(franchiseId);

  if (!franchise) {
    res.status(404).json({ message: 'Franchise not found' });
    return;
  }

  const userId = getAuthUser(req);
  const mediaList = Array.from(db.media.values()).filter((m) => m.franchiseId === franchiseId);

  const mainStory: any[] = [];
  const sequels: any[] = [];
  const prequels: any[] = [];
  const movies: any[] = [];
  const ovasAndSpecials: any[] = [];
  const manga: any[] = [];
  const spinOffs: any[] = [];

  const rollupComponents: RollupComponent[] = [];

  for (const m of mediaList) {
    // Check user library tracking if user is logged in
    let userLib: any = null;
    let progressPercentage = 0;
    let isCompleted = false;

    if (userId) {
      for (const lib of db.userLibrary.values()) {
        if (lib.userId === userId && lib.mediaId === m.id) {
          const prog = db.userProgress.get(lib.id);
          const rate = db.userRatings.get(lib.id);
          userLib = { ...lib, progress: prog, rating: rate };
          if (prog) {
            progressPercentage = prog.progressPercentage;
            isCompleted = prog.isCompleted;
          }
          break;
        }
      }
    }

    // Determine relation type
    let relType: RelationshipType | undefined;
    for (const r of db.mediaRelationships.values()) {
      if (r.targetMediaId === m.id) {
        relType = r.relationshipType;
        break;
      }
    }

    const component = {
      media: m,
      userLibrary: userLib,
      relationshipType: relType,
      isCanonical: true
    };

    rollupComponents.push({
      mediaId: m.id,
      type: m.type,
      format: m.format,
      isCanon: true,
      status: userLib?.status,
      isCompleted,
      progressPercentage
    });

    if (m.type === MediaType.MANGA) {
      manga.push(component);
    } else if (m.format === MediaFormat.MOVIE) {
      movies.push(component);
    } else if (
      m.format === MediaFormat.SPECIAL ||
      m.format === MediaFormat.OVA ||
      m.format === MediaFormat.ONA
    ) {
      ovasAndSpecials.push(component);
    } else if (relType === RelationshipType.SEQUEL) {
      sequels.push(component);
    } else if (relType === RelationshipType.PREQUEL) {
      prequels.push(component);
    } else if (relType === RelationshipType.SPIN_OFF || relType === RelationshipType.SIDE_STORY) {
      spinOffs.push(component);
    } else {
      mainStory.push(component);
    }
  }

  const rollup = FranchiseRollupCalculator.calculateRollup(rollupComponents);

  const response: FranchiseTreeResponse = {
    franchise,
    mainStory,
    sequels,
    prequels,
    movies,
    ovasAndSpecials,
    manga,
    spinOffs,
    completionStats: {
      totalItems: rollup.totalApplicable,
      completedItems: rollup.completedCount,
      completionPercentage: rollup.aggregatePercentage
    }
  };

  res.json(response);
});

export const franchisesRouter = router;

