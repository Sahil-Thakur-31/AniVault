import {
  MediaType,
  MediaFormat,
  AiringStatus,
  RelationshipType,
  LibraryStatus,
  RatingSystem,
  ExternalProvider,
  SyncDirection,
  ConflictStrategy
} from './enums.js';
import { Media, UserLibrary, UserProgress } from './models.js';

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  user: {
    id: string;
    email: string;
    username: string;
    avatarUrl?: string | null;
  };
  accessToken: string;
}

export interface CreateFranchiseDto {
  canonicalTitle: string;
  originalTitle?: string;
  description?: string;
  bannerUrl?: string;
}

export interface FranchiseTreeComponent {
  media: Media;
  userLibrary?: UserLibrary | null;
  relationshipType?: RelationshipType;
  isCanonical: boolean;
}

export interface FranchiseTreeResponse {
  franchise: {
    id: string;
    canonicalTitle: string;
    originalTitle?: string | null;
    description?: string | null;
    bannerUrl?: string | null;
  };
  mainStory: FranchiseTreeComponent[];
  sequels: FranchiseTreeComponent[];
  prequels: FranchiseTreeComponent[];
  movies: FranchiseTreeComponent[];
  ovasAndSpecials: FranchiseTreeComponent[];
  manga: FranchiseTreeComponent[];
  spinOffs: FranchiseTreeComponent[];
  completionStats: {
    totalItems: number;
    completedItems: number;
    completionPercentage: number;
  };
}

export interface CreateMediaDto {
  franchiseId?: string;
  type: MediaType;
  format: MediaFormat;
  titleRomaji: string;
  titleEnglish?: string;
  titleNative?: string;
  synopsis?: string;
  coverImageUrl?: string;
  bannerImageUrl?: string;
  status?: AiringStatus;
  startDate?: string;
  endDate?: string;
  totalEpisodes?: number;
  totalChapters?: number;
  totalVolumes?: number;
  durationMinutes?: number;
  genres?: string[];
  studios?: string[];
  isAdult?: boolean;
}

export interface AddLibraryEntryDto {
  mediaId: string;
  status: LibraryStatus;
  score?: number;
  currentEpisode?: number;
  currentChapter?: number;
  currentVolume?: number;
  startedAt?: string;
  completedAt?: string;
  personalNotes?: string;
  isFavorite?: boolean;
}

export interface UpdateProgressDto {
  currentEpisode?: number;
  currentChapter?: number;
  currentVolume?: number;
  status?: LibraryStatus;
}

export interface QuickIncrementDto {
  delta?: number;
}

export interface SyncMutationEvent {
  eventId: string;
  userId: string;
  mediaId: string;
  type: 'PROGRESS_UPDATED' | 'STATUS_CHANGED' | 'RATING_UPDATED';
  field: string;
  oldValue: any;
  newValue: any;
  createdAt: string;
  sourceClient: string;
}

export interface ResolveConflictDto {
  conflictId: string;
  strategy: ConflictStrategy;
  customEpisode?: number;
}

export interface QuickTrackerWidgetData {
  mediaId: string;
  title: string;
  type: MediaType;
  format: MediaFormat;
  coverImageUrl?: string | null;
  currentProgress: number;
  totalUnits?: number | null;
  progressPercentage: number;
  status: LibraryStatus;
  lastUpdated: string;
}

