import { z } from 'zod';
import { MediaType, MediaFormat, LibraryStatus } from '@anivault/shared-types';

export const importItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  titleEnglish: z.string().optional(),
  titleNative: z.string().optional(),
  type: z.nativeEnum(MediaType),
  format: z.nativeEnum(MediaFormat),
  status: z.nativeEnum(LibraryStatus),
  progress: z.object({
    currentEpisode: z.number().int().nonnegative().optional(),
    totalEpisodes: z.number().int().nonnegative().nullable().optional(),
    currentChapter: z.number().nonnegative().optional(),
    totalChapters: z.number().int().nonnegative().nullable().optional(),
    currentVolume: z.number().int().nonnegative().optional(),
    totalVolumes: z.number().int().nonnegative().nullable().optional()
  }),
  rating: z.object({
    score: z.number().min(0).max(100).optional(),
    ratingSystem: z.string().optional(),
    reviewText: z.string().optional()
  }).optional(),
  dates: z.object({
    startedAt: z.string().nullable().optional(),
    completedAt: z.string().nullable().optional()
  }).optional(),
  externalIds: z.record(z.union([z.string(), z.number()])).optional(),
  personalNotes: z.string().optional(),
  rewatchRereadCount: z.number().int().nonnegative().default(0),
  isFavorite: z.boolean().default(false),
  customTags: z.array(z.string()).default([])
});

export const importFranchiseSchema = z.object({
  canonicalTitle: z.string().min(1),
  originalTitle: z.string().optional(),
  description: z.string().optional(),
  franchiseMediaIds: z.array(z.string()).default([])
});

export const universalImportExportSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  exportedAt: z.string(),
  application: z.literal('AniVault'),
  user: z.object({
    username: z.string(),
    exportId: z.string().optional()
  }),
  franchises: z.array(importFranchiseSchema).default([]),
  library: z.array(importItemSchema)
});

export type UniversalImportPayload = z.infer<typeof universalImportExportSchema>;
export type ImportItemPayload = z.infer<typeof importItemSchema>;

