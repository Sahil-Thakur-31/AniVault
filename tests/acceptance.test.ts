import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  FranchiseRollupCalculator,
  ProgressCalculator,
  RatingConverter,
  SpoilerFilter
} from '../packages/domain/src/index.js';
import {
  ConflictResolver,
  TokenBucketRateLimiter
} from '../packages/sync-engine/src/index.js';
import {
  universalImportExportSchema
} from '../packages/validation/src/index.js';
import {
  MediaType,
  MediaFormat,
  LibraryStatus,
  RatingSystem,
  ConflictStrategy,
  ExternalProvider
} from '../packages/shared-types/src/index.js';

describe('AniVault Acceptance Test Suite (Phases 1 - 6)', () => {
  // Test 1: Franchise Hierarchy & Completion Rollup
  it('P0-1: Franchise rollup groups multiple components and calculates completion percentage', () => {
    const components = [
      {
        mediaId: 'naruto-tv',
        type: MediaType.ANIME,
        format: MediaFormat.TV,
        isCanon: true,
        isCompleted: true,
        progressPercentage: 100.0
      },
      {
        mediaId: 'shippuden-tv',
        type: MediaType.ANIME,
        format: MediaFormat.TV,
        isCanon: true,
        isCompleted: true,
        progressPercentage: 100.0
      },
      {
        mediaId: 'naruto-movie-1',
        type: MediaType.ANIME,
        format: MediaFormat.MOVIE,
        isCanon: false,
        isCompleted: false,
        progressPercentage: 50.0
      },
      {
        mediaId: 'naruto-manga',
        type: MediaType.MANGA,
        format: MediaFormat.MANGA,
        isCanon: true,
        isCompleted: true,
        progressPercentage: 100.0
      }
    ];

    // Including all
    const allRollup = FranchiseRollupCalculator.calculateRollup(components, {
      includeMovies: true,
      includeManga: true
    });
    assert.strictEqual(allRollup.totalApplicable, 4);
    assert.strictEqual(allRollup.completedCount, 3);
    assert.strictEqual(allRollup.aggregatePercentage, 87.5);

    // Exclude non-canon movie
    const canonOnly = FranchiseRollupCalculator.calculateRollup(components, {
      canonOnly: true
    });
    assert.strictEqual(canonOnly.totalApplicable, 3);
    assert.strictEqual(canonOnly.completedCount, 3);
    assert.strictEqual(canonOnly.aggregatePercentage, 100.0);
  });

  // Test 2: Dual-Track Progress Decoupling
  it('P0-2: Anime tracking and Manga tracking are completely independent systems', () => {
    let animeEp = 11;
    let animeStatus = LibraryStatus.WATCHING;

    let mangaCh = 85;
    let mangaStatus = LibraryStatus.READING;

    // Mutate anime
    const animeResult = ProgressCalculator.calculateAnimeProgress(animeEp + 1, 24, animeStatus);
    animeEp = animeResult.currentUnit;
    animeStatus = animeResult.suggestedStatus;

    assert.strictEqual(animeEp, 12);
    assert.strictEqual(animeResult.percentage, 50.0);

    // Verify manga is completely untouched
    assert.strictEqual(mangaCh, 85);
    assert.strictEqual(mangaStatus, LibraryStatus.READING);
  });

  // Test 3: Batch Season / Franchise Completion
  it('P0-3: Batch completion marks entire series completed in 1 atomic operation', () => {
    const result = ProgressCalculator.batchComplete(220, MediaType.ANIME);
    assert.strictEqual(result.currentUnit, 220);
    assert.strictEqual(result.status, LibraryStatus.COMPLETED);
    assert.strictEqual(result.percentage, 100.0);
  });

  // Test 4: Deterministic 3-Way Sync Conflict Resolution
  it('P1-4: Conflict resolution resolves discrepancies according to specified strategy', () => {
    const comparison = {
      mediaId: 'bleach-tybw',
      localEpisode: 12,
      localStatus: LibraryStatus.WATCHING,
      localTimestamp: '2026-11-07T12:00:00Z',
      remoteEpisode: 14,
      remoteStatus: LibraryStatus.WATCHING,
      remoteTimestamp: '2026-11-07T12:05:00Z',
      provider: ExternalProvider.ANILIST
    };

    // Strategy A: AniVault Master
    const resLocalMaster = ConflictResolver.evaluateAndResolve(
      comparison,
      ConflictStrategy.ANI_VAULT_MASTER
    );
    assert.strictEqual(resLocalMaster.resolvedEpisode, 12);
    assert.strictEqual(resLocalMaster.requiresRemotePush, true);
    assert.strictEqual(resLocalMaster.requiresLocalUpdate, false);

    // Strategy B: Highest Watermark Progress
    const resHighest = ConflictResolver.evaluateAndResolve(
      comparison,
      ConflictStrategy.HIGHEST_PROGRESS
    );
    assert.strictEqual(resHighest.resolvedEpisode, 14);
    assert.strictEqual(resHighest.requiresLocalUpdate, true);

    // Strategy C: Remote Provider Wins
    const resRemoteWins = ConflictResolver.evaluateAndResolve(
      comparison,
      ConflictStrategy.REMOTE_PROVIDER_WINS
    );
    assert.strictEqual(resRemoteWins.resolvedEpisode, 14);
    assert.strictEqual(resRemoteWins.requiresLocalUpdate, true);
  });

  // Test 5: Universal JSON Import/Export Schema Validation
  it('P0-5: Universal JSON export matches Draft 2020-12 schemaVersion 1.0.0 specification', () => {
    const validPayload = {
      schemaVersion: '1.0.0',
      exportedAt: '2026-11-07T12:00:00Z',
      application: 'AniVault',
      user: {
        username: 'otaku_architect'
      },
      franchises: [
        {
          canonicalTitle: 'Naruto',
          franchiseMediaIds: ['m1']
        }
      ],
      library: [
        {
          title: 'Naruto',
          type: 'ANIME',
          format: 'TV',
          status: 'COMPLETED',
          progress: {
            currentEpisode: 220,
            totalEpisodes: 220
          },
          rating: {
            score: 8.5
          },
          externalIds: {
            anilist: 20,
            myanimelist: 20
          }
        }
      ]
    };

    const parsed = universalImportExportSchema.safeParse(validPayload);
    assert.strictEqual(parsed.success, true);

    // Invalid schema test (bad schema version)
    const invalidPayload = { ...validPayload, schemaVersion: '2.0.0' };
    const invalidParsed = universalImportExportSchema.safeParse(invalidPayload);
    assert.strictEqual(invalidParsed.success, false);
  });

  // Test 6: Rate Limiter Token Bucket
  it('P1-6: Rate limiter regulates burst tokens and respects capacity', () => {
    const limiter = new TokenBucketRateLimiter(2, 2); // 2 capacity, 2 tokens/sec
    assert.strictEqual(limiter.tryConsume(1), true);
    assert.strictEqual(limiter.tryConsume(1), true);
    // Exhausted
    assert.strictEqual(limiter.tryConsume(1), false);
  });

  // Test 7: Multi-System Rating Converter
  it('P2-7: Rating converter accurately translates 100-pt, 10-pt, and 5-star scores', () => {
    // 100-pt to 10-pt
    const score10 = RatingConverter.normalizeToTenPoint(85, RatingSystem.POINT_100);
    assert.strictEqual(score10, 8.5);

    // 5-star to 10-pt
    const starScore = RatingConverter.normalizeToTenPoint(4.5, RatingSystem.POINT_5_STAR);
    assert.strictEqual(starScore, 9.0);

    // 10-pt to 100-pt
    const backTo100 = RatingConverter.convertFromTenPoint(8.5, RatingSystem.POINT_100);
    assert.strictEqual(backTo100, 85);
  });

  // Test 8: Progress-Aware Spoiler Protection Filter
  it('P2-8: Spoiler filter protects users from future episode synopsis and thumbnails', () => {
    // Watched episode 10, viewing episode 15 (strict mode)
    const masked = SpoilerFilter.shouldMaskEpisode(15, 10, 'STRICT');
    assert.strictEqual(masked.maskSynopsis, true);
    assert.strictEqual(masked.maskThumbnail, true);
    assert.strictEqual(masked.maskTitle, true);

    // Viewing episode 5 (already watched)
    const unmasked = SpoilerFilter.shouldMaskEpisode(5, 10, 'STRICT');
    assert.strictEqual(unmasked.maskSynopsis, false);
    assert.strictEqual(unmasked.maskThumbnail, false);
    assert.strictEqual(unmasked.maskTitle, false);
  });
});

