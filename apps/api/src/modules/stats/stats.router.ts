import { Router, Request, Response } from 'express';
import { db } from '../../database/db.service.js';
import { getAuthUser } from '../auth/auth.router.js';
import { LibraryStatus, MediaType } from '@anivault/shared-types';

const router = Router();

function resolveUserId(req: Request): string {
  const userId = getAuthUser(req);
  if (userId) return userId;
  const firstUser = Array.from(db.users.values())[0];
  return firstUser ? firstUser.id : 'anonymous-user';
}

router.get('/overview', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);

  const library = Array.from(db.userLibrary.values()).filter((l) => l.userId === userId);

  let animeCompleted = 0;
  let mangaCompleted = 0;
  let currentlyWatching = 0;
  let currentlyReading = 0;
  let totalEpisodesWatched = 0;
  let totalChaptersRead = 0;
  let totalMinutesWatched = 0;
  const genreCounts: Record<string, number> = {};

  for (const lib of library) {
    const media = db.media.get(lib.mediaId);
    const progress = db.userProgress.get(lib.id);
    if (!media) continue;

    if (media.type === MediaType.ANIME) {
      if (lib.status === LibraryStatus.COMPLETED) animeCompleted++;
      if (lib.status === LibraryStatus.WATCHING) currentlyWatching++;
      const eps = progress?.currentEpisode || 0;
      totalEpisodesWatched += eps;
      totalMinutesWatched += eps * (media.durationMinutes || 24);
    } else {
      if (lib.status === LibraryStatus.COMPLETED) mangaCompleted++;
      if (lib.status === LibraryStatus.READING) currentlyReading++;
      totalChaptersRead += progress?.currentChapter || 0;
    }

    for (const g of media.genres) {
      genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
  }

  const daysWatched = Math.round((totalMinutesWatched / (60 * 24)) * 10) / 10;

  res.json({
    animeCompleted,
    mangaCompleted,
    currentlyWatching,
    currentlyReading,
    totalEpisodesWatched,
    totalChaptersRead,
    totalHoursWatched: Math.round(totalMinutesWatched / 60),
    daysWatched,
    activeStreakDays: 14,
    genreDistribution: genreCounts,
    topStudios: ['Studio Pierrot', 'ufotable', 'MAPPA', 'Bones']
  });
});

router.get('/calendar', (req: Request, res: Response): void => {
  const schedule = [
    {
      mediaId: 'm0000000-0000-0000-0000-000000000006',
      title: 'Bleach: Thousand-Year Blood War',
      episodeNumber: 27,
      airingAt: new Date(Date.now() + 86400000 * 2).toISOString(),
      confidence: 'CONFIRMED'
    },
    {
      mediaId: 'm0000000-0000-0000-0000-000000000002',
      title: 'Boruto: Two Blue Vortex',
      episodeNumber: 1,
      airingAt: new Date(Date.now() + 86400000 * 5).toISOString(),
      confidence: 'ESTIMATED'
    }
  ];

  res.json(schedule);
});

export const statsRouter = router;

