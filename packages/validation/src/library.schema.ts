import { z } from 'zod';
import { LibraryStatus, RatingSystem } from '@anivault/shared-types';

export const addLibraryEntrySchema = z.object({
  mediaId: z.string().min(1, 'Media ID is required'),
  status: z.nativeEnum(LibraryStatus),
  score: z.number().min(0).max(100).optional(),
  currentEpisode: z.number().int().nonnegative().optional(),
  currentChapter: z.number().nonnegative().optional(),
  currentVolume: z.number().int().nonnegative().optional(),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  personalNotes: z.string().optional(),
  isFavorite: z.boolean().default(false)
});

export const updateProgressSchema = z.object({
  currentEpisode: z.number().int().nonnegative().optional(),
  currentChapter: z.number().nonnegative().optional(),
  currentVolume: z.number().int().nonnegative().optional(),
  status: z.nativeEnum(LibraryStatus).optional()
});

export const updateRatingSchema = z.object({
  score: z.number().min(0).max(100),
  ratingSystem: z.nativeEnum(RatingSystem).default(RatingSystem.POINT_10_DECIMAL),
  reviewText: z.string().optional()
});

