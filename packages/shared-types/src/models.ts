import {
  MediaType,
  MediaFormat,
  AiringStatus,
  RelationshipType,
  LibraryStatus,
  RatingSystem,
  ExternalProvider,
  SyncDirection,
  JobStatus
} from './enums.js';

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserPreferences {
  userId: string;
  preferredTheme: string;
  ratingSystem: RatingSystem;
  spoilerProtectionLevel: 'STRICT' | 'MODERATE' | 'OFF';
  preferredTitleLanguage: 'ROMAJI' | 'ENGLISH' | 'NATIVE';
  enablePushNotifications: boolean;
  autoSyncIntervalMinutes: number;
}

export interface Franchise {
  id: string;
  canonicalTitle: string;
  originalTitle?: string | null;
  description?: string | null;
  bannerUrl?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Media {
  id: string;
  franchiseId?: string | null;
  type: MediaType;
  format: MediaFormat;
  titleRomaji: string;
  titleEnglish?: string | null;
  titleNative?: string | null;
  synopsis?: string | null;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  status: AiringStatus;
  startDate?: string | null;
  endDate?: string | null;
  totalEpisodes?: number | null;
  totalChapters?: number | null;
  totalVolumes?: number | null;
  durationMinutes?: number | null;
  genres: string[];
  studios: string[];
  isAdult: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MediaRelationship {
  id: string;
  sourceMediaId: string;
  targetMediaId: string;
  relationshipType: RelationshipType;
  isCanonical: boolean;
  notes?: string | null;
  createdAt: Date | string;
  targetMedia?: Media;
}

export interface MediaExternalId {
  id: string;
  mediaId: string;
  provider: ExternalProvider;
  externalId: string;
  externalUrl?: string | null;
  lastVerifiedAt: Date | string;
}

export interface Episode {
  id: string;
  mediaId: string;
  episodeNumber: number;
  absoluteNumber?: number | null;
  title?: string | null;
  synopsis?: string | null;
  airDate?: string | null;
  isFiller: boolean;
  thumbnailUrl?: string | null;
}

export interface Chapter {
  id: string;
  mediaId: string;
  chapterNumber: number;
  volumeNumber?: number | null;
  title?: string | null;
  releaseDate?: string | null;
}

export interface UserLibrary {
  id: string;
  userId: string;
  mediaId: string;
  status: LibraryStatus;
  isFavorite: boolean;
  isPrivate: boolean;
  rewatchRereadCount: number;
  startedAt?: string | null;
  completedAt?: string | null;
  personalNotes?: string | null;
  customTags: string[];
  lastInteractedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  media?: Media;
  progress?: UserProgress;
  rating?: UserRating;
}

export interface UserProgress {
  id: string;
  userLibraryId: string;
  currentEpisode: number;
  currentChapter: number;
  currentVolume: number;
  progressPercentage: number;
  isCompleted: boolean;
  updatedAt: Date | string;
}

export interface UserRating {
  id: string;
  userLibraryId: string;
  score: number;
  ratingSystem: RatingSystem;
  reviewText?: string | null;
  updatedAt: Date | string;
}

export interface UserActivity {
  id: string;
  userId: string;
  mediaId: string;
  eventType: string;
  fieldChanged: string;
  oldValue?: string | null;
  newValue?: string | null;
  sourceClient: string;
  createdAt: Date | string;
  media?: Media;
}

export interface ConnectedAccount {
  id: string;
  userId: string;
  provider: ExternalProvider;
  providerUserId: string;
  providerUsername: string;
  tokenExpiresAt?: Date | string | null;
  syncDirection: SyncDirection;
  isSyncEnabled: boolean;
  lastSyncedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface SyncJob {
  id: string;
  userId: string;
  connectedAccountId: string;
  mediaId?: string | null;
  status: JobStatus;
  direction: SyncDirection;
  payloadDiff: Record<string, any>;
  errorMessage?: string | null;
  retryCount: number;
  createdAt: Date | string;
  executedAt?: Date | string | null;
}

export interface SyncConflict {
  id: string;
  userId: string;
  mediaId: string;
  mediaTitle: string;
  provider: ExternalProvider;
  localEpisode: number;
  localStatus: LibraryStatus;
  localUpdatedAt: Date | string;
  remoteEpisode: number;
  remoteStatus: LibraryStatus;
  remoteUpdatedAt: Date | string;
  detectedAt: Date | string;
}

export interface WidgetConfig {
  id: string;
  userId: string;
  widgetIdentifier: string;
  widgetType: string;
  configurationPayload: Record<string, any>;
  updatedAt: Date | string;
}

