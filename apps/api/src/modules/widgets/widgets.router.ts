import { Router, Request, Response } from 'express';
import { db } from '../../database/db.service.js';
import { getAuthUser } from '../auth/auth.router.js';
import { LibraryStatus, MediaType, QuickTrackerWidgetData } from '@anivault/shared-types';
import { ProgressCalculator } from '@anivault/domain';

const router = Router();

function resolveUserId(req: Request): string {
  const userId = getAuthUser(req);
  if (userId) return userId;
  const firstUser = Array.from(db.users.values())[0];
  return firstUser ? firstUser.id : 'anonymous-user';
}

// Quick tracker payload (compact, sub-1KB payload for widgets)
router.get('/quick-tracker', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);

  // Find currently active item
  const watchingItems = Array.from(db.userLibrary.values())
    .filter((lib) => lib.userId === userId && (lib.status === LibraryStatus.WATCHING || lib.status === LibraryStatus.READING))
    .sort((a, b) => new Date(b.lastInteractedAt).getTime() - new Date(a.lastInteractedAt).getTime());

  const results: QuickTrackerWidgetData[] = [];

  for (const lib of watchingItems) {
    const media = db.media.get(lib.mediaId);
    const progress = db.userProgress.get(lib.id);
    if (!media || !progress) continue;

    results.push({
      mediaId: media.id,
      title: media.titleRomaji,
      type: media.type,
      format: media.format,
      coverImageUrl: media.coverImageUrl,
      currentProgress: media.type === MediaType.MANGA ? progress.currentChapter : progress.currentEpisode,
      totalUnits: media.type === MediaType.MANGA ? media.totalChapters : media.totalEpisodes,
      progressPercentage: progress.progressPercentage,
      status: lib.status,
      lastUpdated: progress.updatedAt.toString()
    });
  }

  res.json(results);
});

// Currently watching top items for medium/large widgets
router.get('/watching-list', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);

  const items = Array.from(db.userLibrary.values())
    .filter((lib) => lib.userId === userId && lib.status === LibraryStatus.WATCHING)
    .slice(0, 5)
    .map((lib) => {
      const media = db.media.get(lib.mediaId)!;
      const progress = db.userProgress.get(lib.id)!;
      return {
        mediaId: media.id,
        title: media.titleRomaji,
        coverImageUrl: media.coverImageUrl,
        currentEpisode: progress?.currentEpisode || 0,
        totalEpisodes: media.totalEpisodes
      };
    });

  res.json(items);
});

// Direct increment action called from AppWidget / AppIntent
router.post('/actions/increment', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);
  const { mediaId, delta = 1 } = req.body;

  let targetLibrary: any = null;
  for (const lib of db.userLibrary.values()) {
    if (lib.userId === userId && lib.mediaId === mediaId) {
      targetLibrary = lib;
      break;
    }
  }

  if (!targetLibrary) {
    res.status(404).json({ message: 'Media not in user library' });
    return;
  }

  const media = db.media.get(mediaId)!;
  const progress = db.userProgress.get(targetLibrary.id)!;

  if (media.type === MediaType.MANGA) {
    const nextCh = Math.max(0, progress.currentChapter + delta);
    const calc = ProgressCalculator.calculateMangaProgress(nextCh, media.totalChapters, targetLibrary.status);
    progress.currentChapter = nextCh;
    progress.progressPercentage = calc.percentage;
    progress.isCompleted = calc.isCompleted;
    targetLibrary.status = calc.suggestedStatus;
  } else {
    const nextEp = Math.max(0, progress.currentEpisode + delta);
    const calc = ProgressCalculator.calculateAnimeProgress(nextEp, media.totalEpisodes, targetLibrary.status);
    progress.currentEpisode = nextEp;
    progress.progressPercentage = calc.percentage;
    progress.isCompleted = calc.isCompleted;
    targetLibrary.status = calc.suggestedStatus;
  }

  targetLibrary.lastInteractedAt = new Date().toISOString();
  progress.updatedAt = new Date().toISOString();

  res.json({
    mediaId,
    newProgress: media.type === MediaType.MANGA ? progress.currentChapter : progress.currentEpisode,
    status: targetLibrary.status,
    syncStatus: 'QUEUED'
  });
});

export const widgetsRouter = router;

