import { Router, Request, Response } from 'express';
import { db } from '../../database/db.service.js';
import { getAuthUser } from '../auth/auth.router.js';
import { universalImportExportSchema } from '@anivault/validation';
import { ProgressCalculator } from '@anivault/domain';
import { MediaType, RatingSystem } from '@anivault/shared-types';
import crypto from 'crypto';

const router = Router();

function resolveUserId(req: Request): string {
  const userId = getAuthUser(req);
  if (userId) return userId;
  const firstUser = Array.from(db.users.values())[0];
  return firstUser ? firstUser.id : 'anonymous-user';
}

// Full fidelity JSON export
router.get('/export/json', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);
  const user = db.users.get(userId) || { username: 'demo_user' };

  const userFranchises = Array.from(db.franchises.values()).map((f) => {
    const childMedia = Array.from(db.media.values())
      .filter((m) => m.franchiseId === f.id)
      .map((m) => m.id);
    return {
      canonicalTitle: f.canonicalTitle,
      originalTitle: f.originalTitle || undefined,
      description: f.description || undefined,
      franchiseMediaIds: childMedia
    };
  });

  const libraryEntries = Array.from(db.userLibrary.values())
    .filter((lib) => lib.userId === userId)
    .map((lib) => {
      const media = db.media.get(lib.mediaId);
      const progress = db.userProgress.get(lib.id);
      const rating = db.userRatings.get(lib.id);

      const extIds: Record<string, string | number> = {};
      for (const e of db.mediaExternalIds.values()) {
        if (e.mediaId === lib.mediaId) {
          extIds[e.provider.toLowerCase()] = e.externalId;
        }
      }

      return {
        id: media?.id,
        title: media?.titleRomaji || 'Unknown Title',
        titleEnglish: media?.titleEnglish || undefined,
        titleNative: media?.titleNative || undefined,
        type: media?.type || MediaType.ANIME,
        format: media?.format,
        status: lib.status,
        progress: {
          currentEpisode: progress?.currentEpisode,
          totalEpisodes: media?.totalEpisodes,
          currentChapter: progress?.currentChapter,
          totalChapters: media?.totalChapters,
          currentVolume: progress?.currentVolume,
          totalVolumes: media?.totalVolumes
        },
        rating: rating
          ? {
              score: rating.score,
              ratingSystem: rating.ratingSystem,
              reviewText: rating.reviewText || undefined
            }
          : undefined,
        dates: {
          startedAt: lib.startedAt,
          completedAt: lib.completedAt
        },
        externalIds: extIds,
        personalNotes: lib.personalNotes || undefined,
        rewatchRereadCount: lib.rewatchRereadCount,
        isFavorite: lib.isFavorite,
        customTags: lib.customTags
      };
    });

  const payload = {
    schemaVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    application: 'AniVault',
    user: {
      username: user.username,
      exportId: crypto.randomUUID()
    },
    franchises: userFranchises,
    library: libraryEntries
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="anivault-export.json"');
  res.json(payload);
});

// JSON Import (Dry-run or Commit)
router.post('/import/json', (req: Request, res: Response): void => {
  try {
    const userId = resolveUserId(req);
    const validated = universalImportExportSchema.parse(req.body);
    const dryRun = req.query.dryRun === 'true';

    let addedCount = 0;
    let updatedCount = 0;
    let duplicatesDetected = 0;
    const diffReport: any[] = [];

    for (const item of validated.library) {
      // 1. Duplicate detection: Check existing media by external ID or normalized title
      let matchedMedia = Array.from(db.media.values()).find(
        (m) => m.titleRomaji.toLowerCase() === item.title.toLowerCase()
      );

      // Check external ID match
      if (item.externalIds) {
        for (const [prov, extId] of Object.entries(item.externalIds)) {
          const match = Array.from(db.mediaExternalIds.values()).find(
            (e) => e.provider.toLowerCase() === prov.toLowerCase() && e.externalId === String(extId)
          );
          if (match) {
            matchedMedia = db.media.get(match.mediaId);
            break;
          }
        }
      }

      const mediaId = matchedMedia ? matchedMedia.id : crypto.randomUUID();

      // Check if user already tracks this
      let existingLibrary = Array.from(db.userLibrary.values()).find(
        (l) => l.userId === userId && l.mediaId === mediaId
      );

      if (existingLibrary) {
        duplicatesDetected++;
        diffReport.push({
          title: item.title,
          action: 'UPDATE_EXISTING',
          oldStatus: existingLibrary.status,
          newStatus: item.status
        });
      } else {
        addedCount++;
        diffReport.push({
          title: item.title,
          action: 'ADD_NEW',
          newStatus: item.status
        });
      }

      if (!dryRun) {
        // If media didn't exist, create it
        if (!matchedMedia) {
          db.media.set(mediaId, {
            id: mediaId,
            franchiseId: null,
            type: item.type,
            format: item.format as any,
            titleRomaji: item.title,
            titleEnglish: item.titleEnglish || null,
            titleNative: item.titleNative || null,
            synopsis: null,
            coverImageUrl: null,
            bannerImageUrl: null,
            status: item.progress.currentEpisode ? ('FINISHED' as any) : ('NOT_YET_RELEASED' as any),
            totalEpisodes: item.progress.totalEpisodes || null,
            totalChapters: item.progress.totalChapters || null,
            totalVolumes: item.progress.totalVolumes || null,
            durationMinutes: null,
            genres: [],
            studios: [],
            isAdult: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }

        // Add or update library
        const libraryId = existingLibrary ? existingLibrary.id : crypto.randomUUID();
        const calc =
          item.type === MediaType.MANGA
            ? ProgressCalculator.calculateMangaProgress(
                item.progress.currentChapter || 0,
                item.progress.totalChapters,
                item.status
              )
            : ProgressCalculator.calculateAnimeProgress(
                item.progress.currentEpisode || 0,
                item.progress.totalEpisodes,
                item.status
              );

        db.userLibrary.set(libraryId, {
          id: libraryId,
          userId,
          mediaId,
          status: item.status,
          isFavorite: item.isFavorite || false,
          isPrivate: false,
          rewatchRereadCount: item.rewatchRereadCount || 0,
          startedAt: item.dates?.startedAt || null,
          completedAt: item.dates?.completedAt || null,
          personalNotes: item.personalNotes || null,
          customTags: item.customTags || [],
          lastInteractedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        db.userProgress.set(libraryId, {
          id: crypto.randomUUID(),
          userLibraryId: libraryId,
          currentEpisode: item.progress.currentEpisode || 0,
          currentChapter: item.progress.currentChapter || 0,
          currentVolume: item.progress.currentVolume || 0,
          progressPercentage: calc.percentage,
          isCompleted: calc.isCompleted,
          updatedAt: new Date().toISOString()
        });

        if (item.rating?.score) {
          db.userRatings.set(libraryId, {
            id: crypto.randomUUID(),
            userLibraryId: libraryId,
            score: item.rating.score,
            ratingSystem: RatingSystem.POINT_10_DECIMAL,
            reviewText: item.rating.reviewText || null,
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    const importJobId = crypto.randomUUID();
    const rollbackToken = crypto.randomUUID();

    res.json({
      importJobId,
      status: dryRun ? 'DRY_RUN_COMPLETED' : 'IMPORT_COMPLETED',
      totalRecords: validated.library.length,
      addedCount,
      updatedCount,
      duplicatesDetected,
      rollbackToken: dryRun ? null : rollbackToken,
      preview: diffReport
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Import parsing failed' });
  }
});

// Flat CSV Export
router.get('/export/csv', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);
  let csv = 'Title,Type,Format,Status,Progress,Score,Started,Completed\n';

  for (const lib of db.userLibrary.values()) {
    if (lib.userId === userId) {
      const media = db.media.get(lib.mediaId);
      const progress = db.userProgress.get(lib.id);
      const rating = db.userRatings.get(lib.id);

      const title = `"${(media?.titleRomaji || '').replace(/"/g, '""')}"`;
      const prog = media?.type === MediaType.MANGA ? progress?.currentChapter || 0 : progress?.currentEpisode || 0;
      csv += `${title},${media?.type || ''},${media?.format || ''},${lib.status},${prog},${rating?.score || ''},${lib.startedAt || ''},${lib.completedAt || ''}\n`;
    }
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="anivault-export.csv"');
  res.send(csv);
});

export const importExportRouter = router;

