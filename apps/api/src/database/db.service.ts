import {
  User,
  UserPreferences,
  Franchise,
  Media,
  MediaRelationship,
  MediaExternalId,
  Episode,
  Chapter,
  UserLibrary,
  UserProgress,
  UserRating,
  UserActivity,
  ConnectedAccount,
  SyncConflict,
  SyncJob,
  WidgetConfig,
  MediaType,
  MediaFormat,
  AiringStatus,
  RelationshipType,
  LibraryStatus,
  RatingSystem,
  ExternalProvider,
  SyncDirection,
  JobStatus
} from '@anivault/shared-types';
import crypto from 'crypto';

export class DatabaseService {
  public users: Map<string, User & { passwordHash: string }> = new Map();
  public userPreferences: Map<string, UserPreferences> = new Map();
  public franchises: Map<string, Franchise> = new Map();
  public media: Map<string, Media> = new Map();
  public mediaRelationships: Map<string, MediaRelationship> = new Map();
  public mediaExternalIds: Map<string, MediaExternalId> = new Map();
  public episodes: Map<string, Episode> = new Map();
  public chapters: Map<string, Chapter> = new Map();
  public userLibrary: Map<string, UserLibrary> = new Map();
  public userProgress: Map<string, UserProgress> = new Map();
  public userRatings: Map<string, UserRating> = new Map();
  public userActivity: UserActivity[] = [];
  public connectedAccounts: Map<string, ConnectedAccount & { accessTokenEnc: string; refreshTokenEnc?: string }> = new Map();
  public syncConflicts: Map<string, SyncConflict> = new Map();
  public syncJobs: Map<string, SyncJob> = new Map();
  public widgetConfigs: Map<string, WidgetConfig> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData(): void {
    // 1. Seed Franchise: Naruto
    const narutoFranchiseId = 'f0000000-0000-0000-0000-000000000001';
    this.franchises.set(narutoFranchiseId, {
      id: narutoFranchiseId,
      canonicalTitle: 'Naruto',
      originalTitle: 'NARUTO -ナルト-',
      description: 'The story of Naruto Uzumaki, a young ninja who seeks recognition from his peers and dreams of becoming the Hokage.',
      bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 1.1 Media: Naruto (Original Anime)
    const narutoAnimeId = 'm0000000-0000-0000-0000-000000000001';
    this.media.set(narutoAnimeId, {
      id: narutoAnimeId,
      franchiseId: narutoFranchiseId,
      type: MediaType.ANIME,
      format: MediaFormat.TV,
      titleRomaji: 'Naruto',
      titleEnglish: 'Naruto',
      titleNative: 'NARUTO -ナルト-',
      synopsis: 'Moments prior to Naruto Uzumaki\'s birth, a huge demon known as the Kyuubi, the Nine-Tailed Fox, attacked Konohagakure...',
      coverImageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
      status: AiringStatus.FINISHED,
      startDate: '2002-10-03',
      endDate: '2007-02-08',
      totalEpisodes: 220,
      durationMinutes: 23,
      genres: ['Action', 'Adventure', 'Fantasy'],
      studios: ['Studio Pierrot'],
      isAdult: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // External IDs for Naruto Anime
    this.mediaExternalIds.set(crypto.randomUUID(), {
      id: crypto.randomUUID(),
      mediaId: narutoAnimeId,
      provider: ExternalProvider.ANILIST,
      externalId: '20',
      externalUrl: 'https://anilist.co/anime/20',
      lastVerifiedAt: new Date().toISOString()
    });
    this.mediaExternalIds.set(crypto.randomUUID(), {
      id: crypto.randomUUID(),
      mediaId: narutoAnimeId,
      provider: ExternalProvider.MYANIMELIST,
      externalId: '20',
      externalUrl: 'https://myanimelist.net/anime/20',
      lastVerifiedAt: new Date().toISOString()
    });

    // 1.2 Media: Naruto Shippuden (Sequel)
    const shippudenAnimeId = 'm0000000-0000-0000-0000-000000000002';
    this.media.set(shippudenAnimeId, {
      id: shippudenAnimeId,
      franchiseId: narutoFranchiseId,
      type: MediaType.ANIME,
      format: MediaFormat.TV,
      titleRomaji: 'Naruto: Shippuuden',
      titleEnglish: 'Naruto: Shippuden',
      titleNative: 'NARUTO -ナルト- 疾風伝',
      synopsis: 'Two and a half years after his departure, Naruto Uzumaki returns to Konohagakure stronger and ready to face the Akatsuki.',
      coverImageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
      status: AiringStatus.FINISHED,
      startDate: '2007-02-15',
      endDate: '2017-03-23',
      totalEpisodes: 500,
      durationMinutes: 23,
      genres: ['Action', 'Adventure', 'Fantasy'],
      studios: ['Studio Pierrot'],
      isAdult: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 1.3 Media: Naruto Movie 1
    const narutoMovieId = 'm0000000-0000-0000-0000-000000000003';
    this.media.set(narutoMovieId, {
      id: narutoMovieId,
      franchiseId: narutoFranchiseId,
      type: MediaType.ANIME,
      format: MediaFormat.MOVIE,
      titleRomaji: 'Naruto the Movie: Ninja Clash in the Land of Snow',
      titleEnglish: 'Ninja Clash in the Land of Snow',
      titleNative: '劇場版 NARUTO -ナルト- 大活劇!雪姫忍法帖だってばよ!!',
      synopsis: 'Naruto and his team are sent on a mission to guard Yukie Fujikaze, a popular actress filming in the Land of Snow.',
      coverImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
      status: AiringStatus.FINISHED,
      startDate: '2004-08-21',
      totalEpisodes: 1,
      durationMinutes: 82,
      genres: ['Action', 'Adventure'],
      studios: ['Studio Pierrot'],
      isAdult: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 1.4 Media: Naruto Manga (Source Material)
    const narutoMangaId = 'm0000000-0000-0000-0000-000000000004';
    this.media.set(narutoMangaId, {
      id: narutoMangaId,
      franchiseId: narutoFranchiseId,
      type: MediaType.MANGA,
      format: MediaFormat.MANGA,
      titleRomaji: 'Naruto',
      titleEnglish: 'Naruto',
      titleNative: 'NARUTO -ナルト-',
      synopsis: 'The foundational manga epic created by Masashi Kishimoto published in Weekly Shonen Jump.',
      coverImageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      status: AiringStatus.FINISHED,
      startDate: '1999-09-21',
      endDate: '2014-11-10',
      totalChapters: 700,
      totalVolumes: 72,
      genres: ['Action', 'Adventure', 'Fantasy'],
      studios: ['Shueisha'],
      isAdult: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Relationships in Naruto
    this.mediaRelationships.set(crypto.randomUUID(), {
      id: crypto.randomUUID(),
      sourceMediaId: narutoAnimeId,
      targetMediaId: shippudenAnimeId,
      relationshipType: RelationshipType.SEQUEL,
      isCanonical: true,
      createdAt: new Date().toISOString()
    });
    this.mediaRelationships.set(crypto.randomUUID(), {
      id: crypto.randomUUID(),
      sourceMediaId: narutoAnimeId,
      targetMediaId: narutoMangaId,
      relationshipType: RelationshipType.ADAPTATION,
      isCanonical: true,
      createdAt: new Date().toISOString()
    });
    this.mediaRelationships.set(crypto.randomUUID(), {
      id: crypto.randomUUID(),
      sourceMediaId: narutoAnimeId,
      targetMediaId: narutoMovieId,
      relationshipType: RelationshipType.SIDE_STORY,
      isCanonical: false,
      createdAt: new Date().toISOString()
    });

    // 2. Seed Franchise: Bleach
    const bleachFranchiseId = 'f0000000-0000-0000-0000-000000000002';
    this.franchises.set(bleachFranchiseId, {
      id: bleachFranchiseId,
      canonicalTitle: 'Bleach',
      originalTitle: 'BLEACH',
      description: 'Ichigo Kurosaki is a high school student who can see ghosts and accidentally receives Soul Reaper powers.',
      bannerUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const bleachAnimeId = 'm0000000-0000-0000-0000-000000000005';
    this.media.set(bleachAnimeId, {
      id: bleachAnimeId,
      franchiseId: bleachFranchiseId,
      type: MediaType.ANIME,
      format: MediaFormat.TV,
      titleRomaji: 'Bleach',
      titleEnglish: 'Bleach',
      titleNative: 'BLEACH',
      synopsis: 'Ichigo Kurosaki never asked for the ability to see ghosts - he was born with the gift...',
      coverImageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
      status: AiringStatus.FINISHED,
      totalEpisodes: 366,
      genres: ['Action', 'Supernatural'],
      studios: ['Studio Pierrot'],
      isAdult: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const bleachTYBWId = 'm0000000-0000-0000-0000-000000000006';
    this.media.set(bleachTYBWId, {
      id: bleachTYBWId,
      franchiseId: bleachFranchiseId,
      type: MediaType.ANIME,
      format: MediaFormat.TV,
      titleRomaji: 'Bleach: Sennen Kessen-hen',
      titleEnglish: 'Bleach: Thousand-Year Blood War',
      titleNative: 'BLEACH 千年血戦篇',
      synopsis: 'The peace is suddenly broken when warning sirens blare through the Soul Society. The Quincy empire attacks.',
      coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      status: AiringStatus.RELEASING,
      totalEpisodes: 52,
      genres: ['Action', 'Supernatural'],
      studios: ['Studio Pierrot'],
      isAdult: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.mediaRelationships.set(crypto.randomUUID(), {
      id: crypto.randomUUID(),
      sourceMediaId: bleachAnimeId,
      targetMediaId: bleachTYBWId,
      relationshipType: RelationshipType.SEQUEL,
      isCanonical: true,
      createdAt: new Date().toISOString()
    });
  }
}

export const db = new DatabaseService();

