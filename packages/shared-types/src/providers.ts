import { MediaType } from './enums.js';

export interface ProviderAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date | string;
  tokenType: string;
  scope?: string[];
}

export interface CanonicalMediaSearchResult {
  provider: 'ANILIST' | 'MYANIMELIST' | 'KITSU' | 'ANIDB' | 'TMDB';
  externalId: string;
  titleRomaji: string;
  titleEnglish?: string;
  titleNative?: string;
  type: MediaType;
  format: string;
  totalEpisodes?: number;
  totalChapters?: number;
  airingStatus: string;
  coverImageUrl?: string;
  bannerImageUrl?: string;
  synopsis?: string;
  year?: number;
}

export interface UserRemoteListItem {
  externalId: string;
  status: 'PLANNING' | 'WATCHING' | 'READING' | 'COMPLETED' | 'ON_HOLD' | 'DROPPED';
  progressEpisodes?: number;
  progressChapters?: number;
  progressVolumes?: number;
  scoreDecimal?: number;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
}

export interface IMediaMetadataProvider {
  readonly providerName: string;
  searchMedia(query: string, type: MediaType, limit?: number): Promise<CanonicalMediaSearchResult[]>;
  fetchMediaById(externalId: string): Promise<CanonicalMediaSearchResult>;
}

export interface ISyncPlatformProvider extends IMediaMetadataProvider {
  generateAuthUrl(state: string, codeChallenge?: string): string;
  exchangeAuthCode(code: string, codeVerifier?: string): Promise<ProviderAuthTokens>;
  refreshTokens(refreshToken: string): Promise<ProviderAuthTokens>;
  getUserProfile(tokens: ProviderAuthTokens): Promise<{ userId: string; username: string; avatarUrl?: string }>;
  fetchUserLibrary(tokens: ProviderAuthTokens): Promise<UserRemoteListItem[]>;
  pushProgressUpdate(
    tokens: ProviderAuthTokens,
    externalId: string,
    progress: { currentEpisode?: number; currentChapter?: number; status?: string }
  ): Promise<{ success: boolean; remoteUpdatedAt: string }>;
  pushRatingUpdate(
    tokens: ProviderAuthTokens,
    externalId: string,
    score: number
  ): Promise<{ success: boolean }>;
}

