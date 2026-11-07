import { z } from 'zod';
import { MediaType, MediaFormat, AiringStatus, RelationshipType, ExternalProvider } from '@anivault/shared-types';

export const createFranchiseSchema = z.object({
  canonicalTitle: z.string().min(1, 'Franchise title is required').max(255),
  originalTitle: z.string().max(255).optional(),
  description: z.string().optional(),
  bannerUrl: z.string().url().optional()
});

export const createMediaSchema = z.object({
  franchiseId: z.string().uuid().optional(),
  type: z.nativeEnum(MediaType),
  format: z.nativeEnum(MediaFormat),
  titleRomaji: z.string().min(1, 'Romaji title is required').max(255),
  titleEnglish: z.string().max(255).optional(),
  titleNative: z.string().max(255).optional(),
  synopsis: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  bannerImageUrl: z.string().url().optional(),
  status: z.nativeEnum(AiringStatus).default(AiringStatus.NOT_YET_RELEASED),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  totalEpisodes: z.number().int().nonnegative().optional(),
  totalChapters: z.number().int().nonnegative().optional(),
  totalVolumes: z.number().int().nonnegative().optional(),
  durationMinutes: z.number().int().positive().optional(),
  genres: z.array(z.string()).default([]),
  studios: z.array(z.string()).default([]),
  isAdult: z.boolean().default(false)
});

export const createMediaRelationshipSchema = z.object({
  targetMediaId: z.string().uuid('Valid target media ID required'),
  relationshipType: z.nativeEnum(RelationshipType),
  isCanonical: z.boolean().default(true),
  notes: z.string().optional()
});

export const addExternalIdSchema = z.object({
  provider: z.nativeEnum(ExternalProvider),
  externalId: z.string().min(1, 'External ID cannot be empty'),
  externalUrl: z.string().url().optional()
});

