import { z } from 'zod';
import { RatingSystem } from '@anivault/shared-types';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores, and dashes'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

export const updatePreferencesSchema = z.object({
  preferredTheme: z.string().optional(),
  ratingSystem: z.nativeEnum(RatingSystem).optional(),
  spoilerProtectionLevel: z.enum(['STRICT', 'MODERATE', 'OFF']).optional(),
  preferredTitleLanguage: z.enum(['ROMAJI', 'ENGLISH', 'NATIVE']).optional(),
  enablePushNotifications: z.boolean().optional(),
  autoSyncIntervalMinutes: z.number().int().min(15).max(1440).optional()
});

