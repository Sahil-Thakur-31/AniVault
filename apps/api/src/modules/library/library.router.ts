import { Router, Request, Response } from 'express';
import { db } from '../../database/db.service.js';
import { getAuthUser } from '../auth/auth.router.js';
import { addLibraryEntrySchema, updateProgressSchema } from '@anivault/validation';
import { ProgressCalculator } from '@anivault/domain';
import {
  LibraryStatus,
  MediaType,
  RatingSystem,
  JobStatus,
  SyncDirection
} from '@anivault/shared-types';
import crypto from 'crypto';

const router = Router();

function resolveUserId(req: Request): string {
  const userId = getAuthUser(req);
  if (userId) return userId;
  const firstUser = Array.from(db.users.values())[0];
  return firstUser ? firstUser.id : 'anonymous-user';
}

// Get user library
router.get('/', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);
  const statusFilter = req.query.status as LibraryStatus | undefined;
  const typeFilter = req.query.type as MediaType | undefined;

  let list = Array.from(db.userLibrary.values()).filter((lib) => lib.userId === userId);

  if (statusFilter) {
    list = list.filter((lib) => lib.status === statusFilter);
  }

  const enriched = list
    .map((lib) => {
      const media = db.media.get(lib.mediaId);
      const progress = db.userProgress.get(lib.id);
      const rating = db.userRatings.get(lib.id);
      return {
        ...lib,
        media,
        progress,
        rating
      };
    })
    .filter((lib) => (typeFilter && lib.media ? lib.media.type === typeFilter : true));

  res.json({ data: enriched, total: enriched.length });
});

// Add entry to personal library
router.post('/', (req: Request, res: Response): void => {
  try {
    const userId = resolveUserId(req);
    const validated = addLibraryEntrySchema.parse(req.body);

    const media = db.media.get(validated.mediaId);
    if (!media) {
      res.status(404).json({ message: 'Media not found' });
      return;
    }

    // Check if already in library
    for (const lib of db.userLibrary.values()) {
      if (lib.userId === userId && lib.mediaId === validated.mediaId) {
        res.status(409).json({ message: 'Title already in user library' });
        return;
      }
    }

    const libraryId = crypto.randomUUID();
    const progressId = crypto.randomUUID();

    const currentEp = validated.currentEpisode || 0;
    const currentCh = validated.currentChapter || 0;
    const currentVol = validated.currentVolume || 0;

    const calc =
      media.type === MediaType.MANGA
        ? ProgressCalculator.calculateMangaProgress(currentCh, media.totalChapters, validated.status)
        : ProgressCalculator.calculateAnimeProgress(currentEp, media.totalEpisodes, validated.status);

    const newLibrary = {
      id: libraryId,
      userId,
      mediaId: validated.mediaId,
      status: calc.suggestedStatus,
      isFavorite: validated.isFavorite || false,
      isPrivate: false,
      rewatchRereadCount: 0,
      startedAt: validated.startedAt || new Date().toISOString().split('T')[0],
      completedAt: calc.isCompleted ? validated.completedAt || new Date().toISOString().split('T')[0] : null,
      personalNotes: validated.personalNotes || null,
      customTags: [],
      lastInteractedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newProgress = {
      id: progressId,
      userLibraryId: libraryId,
      currentEpisode: currentEp,
      currentChapter: currentCh,
      currentVolume: currentVol,
      progressPercentage: calc.percentage,
      isCompleted: calc.isCompleted,
      updatedAt: new Date().toISOString()
    };

    db.userLibrary.set(libraryId, newLibrary);
    db.userProgress.set(libraryId, newProgress);

    if (validated.score !== undefined) {
      const ratingId = crypto.randomUUID();
      db.userRatings.set(libraryId, {
        id: ratingId,
        userLibraryId: libraryId,
        score: validated.score,
        ratingSystem: RatingSystem.POINT_10_DECIMAL,
        reviewText: null,
        updatedAt: new Date().toISOString()
      });
    }

    // Log Activity
    db.userActivity.unshift({
      id: crypto.randomUUID(),
      userId,
      mediaId: media.id,
      eventType: 'LIBRARY_ADDED',
      fieldChanged: 'status',
      newValue: validated.status,
      sourceClient: 'WEB',
      createdAt: new Date().toISOString()
    });

    res.status(201).json({
      ...newLibrary,
      media,
      progress: newProgress,
      rating: db.userRatings.get(libraryId) || null
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update progress (decoupled anime vs manga)
router.patch('/:id/progress', (req: Request, res: Response): void => {
  try {
    const libraryId = String(req.params.id);
    const library = db.userLibrary.get(libraryId);
    if (!library) {
      res.status(404).json({ message: 'Library entry not found' });
      return;
    }

    const progress = db.userProgress.get(libraryId);
    if (!progress) {
      res.status(404).json({ message: 'Progress record not found' });
      return;
    }

    const media = db.media.get(library.mediaId)!;
    const validated = updateProgressSchema.parse(req.body);

    let nextEp = progress.currentEpisode;
    let nextCh = progress.currentChapter;
    let nextVol = progress.currentVolume;
    let nextStatus = validated.status || library.status;

    if (validated.currentEpisode !== undefined) {
      nextEp = validated.currentEpisode;
      const calc = ProgressCalculator.calculateAnimeProgress(nextEp, media.totalEpisodes, nextStatus);
      progress.progressPercentage = calc.percentage;
      progress.isCompleted = calc.isCompleted;
      nextStatus = calc.suggestedStatus;
    }

    if (validated.currentChapter !== undefined) {
      nextCh = validated.currentChapter;
      const calc = ProgressCalculator.calculateMangaProgress(nextCh, media.totalChapters, nextStatus);
      progress.progressPercentage = calc.percentage;
      progress.isCompleted = calc.isCompleted;
      nextStatus = calc.suggestedStatus;
    }

    if (validated.currentVolume !== undefined) {
      nextVol = validated.currentVolume;
    }

    progress.currentEpisode = nextEp;
    progress.currentChapter = nextCh;
    progress.currentVolume = nextVol;
    progress.updatedAt = new Date().toISOString();

    library.status = nextStatus;
    library.lastInteractedAt = new Date().toISOString();
    library.updatedAt = new Date().toISOString();

    // Trigger sync jobs for connected accounts
    for (const acc of db.connectedAccounts.values()) {
      if (acc.userId === library.userId && acc.isSyncEnabled) {
        db.syncJobs.set(crypto.randomUUID(), {
          id: crypto.randomUUID(),
          userId: library.userId,
          connectedAccountId: acc.id,
          mediaId: media.id,
          status: JobStatus.PENDING,
          direction: SyncDirection.PUSH_TO_PROVIDER,
          payloadDiff: { episode: nextEp, chapter: nextCh, status: nextStatus },
          retryCount: 0,
          createdAt: new Date().toISOString()
        });
      }
    }

    res.json({
      ...library,
      media,
      progress
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Quick increment for widgets or rapid 1-click updates (+1)
router.post('/:id/quick-increment', (req: Request, res: Response): void => {
  const libraryId = String(req.params.id);
  const library = db.userLibrary.get(libraryId);
  if (!library) {
    res.status(404).json({ message: 'Library entry not found' });
    return;
  }

  const progress = db.userProgress.get(libraryId);
  if (!progress) {
    res.status(404).json({ message: 'Progress record not found' });
    return;
  }

  const media = db.media.get(library.mediaId)!;
  const delta = (req.body.delta as number) || 1;

  if (media.type === MediaType.MANGA) {
    const nextCh = Math.max(0, progress.currentChapter + delta);
    const calc = ProgressCalculator.calculateMangaProgress(nextCh, media.totalChapters, library.status);
    progress.currentChapter = nextCh;
    progress.progressPercentage = calc.percentage;
    progress.isCompleted = calc.isCompleted;
    library.status = calc.suggestedStatus;
  } else {
    const nextEp = Math.max(0, progress.currentEpisode + delta);
    const calc = ProgressCalculator.calculateAnimeProgress(nextEp, media.totalEpisodes, library.status);
    progress.currentEpisode = nextEp;
    progress.progressPercentage = calc.percentage;
    progress.isCompleted = calc.isCompleted;
    library.status = calc.suggestedStatus;
  }

  library.lastInteractedAt = new Date().toISOString();
  progress.updatedAt = new Date().toISOString();

  res.json({
    ...library,
    media,
    progress
  });
});

// Complete batch (mark whole season/manga completed in 1 click)
router.post('/:id/complete-batch', (req: Request, res: Response): void => {
  const libraryId = String(req.params.id);
  const library = db.userLibrary.get(libraryId);
  if (!library) {
    res.status(404).json({ message: 'Library entry not found' });
    return;
  }

  const progress = db.userProgress.get(libraryId);
  if (!progress) {
    res.status(404).json({ message: 'Progress not found' });
    return;
  }

  const media = db.media.get(library.mediaId)!;

  if (media.type === MediaType.MANGA) {
    progress.currentChapter = media.totalChapters || progress.currentChapter;
  } else {
    progress.currentEpisode = media.totalEpisodes || progress.currentEpisode;
  }

  progress.progressPercentage = 100.0;
  progress.isCompleted = true;
  progress.updatedAt = new Date().toISOString();

  library.status = LibraryStatus.COMPLETED;
  library.completedAt = new Date().toISOString().split('T')[0];
  library.lastInteractedAt = new Date().toISOString();

  res.json({
    ...library,
    media,
    progress
  });
});

export const libraryRouter = router;

