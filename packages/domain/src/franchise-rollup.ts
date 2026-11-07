import { MediaFormat, MediaType, LibraryStatus } from '@anivault/shared-types';

export interface RollupComponent {
  mediaId: string;
  type: MediaType;
  format: MediaFormat;
  isCanon: boolean;
  status?: LibraryStatus;
  isCompleted: boolean;
  progressPercentage: number;
}

export interface RollupOptions {
  includeManga?: boolean;
  includeMovies?: boolean;
  includeSpecials?: boolean;
  canonOnly?: boolean;
}

export class FranchiseRollupCalculator {
  public static calculateRollup(
    components: RollupComponent[],
    options: RollupOptions = {}
  ): {
    totalApplicable: number;
    completedCount: number;
    aggregatePercentage: number;
  } {
    const {
      includeManga = true,
      includeMovies = true,
      includeSpecials = false,
      canonOnly = false
    } = options;

    const filtered = components.filter((item) => {
      if (canonOnly && !item.isCanon) return false;
      if (!includeManga && item.type === MediaType.MANGA) return false;
      if (!includeMovies && item.format === MediaFormat.MOVIE) return false;
      if (
        !includeSpecials &&
        (item.format === MediaFormat.SPECIAL ||
          item.format === MediaFormat.OVA ||
          item.format === MediaFormat.ONA)
      ) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      return { totalApplicable: 0, completedCount: 0, aggregatePercentage: 0 };
    }

    const completedCount = filtered.filter((i) => i.isCompleted).length;
    const sumPercentages = filtered.reduce((acc, curr) => acc + curr.progressPercentage, 0);
    const aggregatePercentage = Math.round((sumPercentages / filtered.length) * 100) / 100;

    return {
      totalApplicable: filtered.length,
      completedCount,
      aggregatePercentage
    };
  }
}

