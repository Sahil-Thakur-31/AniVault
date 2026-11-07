import { MediaType, LibraryStatus } from '@anivault/shared-types';

export interface ProgressCalculationResult {
  currentUnit: number;
  totalUnits: number | null;
  percentage: number;
  isCompleted: boolean;
  suggestedStatus: LibraryStatus;
}

export class ProgressCalculator {
  /**
   * Calculates anime episode completion metrics without mutating manga counters
   */
  public static calculateAnimeProgress(
    currentEpisode: number,
    totalEpisodes: number | null | undefined,
    currentStatus: LibraryStatus
  ): ProgressCalculationResult {
    const validCurrent = Math.max(0, currentEpisode);
    const validTotal = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : null;

    let percentage = 0;
    if (validTotal) {
      percentage = Math.min(100, Math.round((validCurrent / validTotal) * 10000) / 100);
    }

    const isCompleted = validTotal !== null && validCurrent >= validTotal;
    let suggestedStatus = currentStatus;

    if (isCompleted && currentStatus !== LibraryStatus.COMPLETED && currentStatus !== LibraryStatus.REWATCHING) {
      suggestedStatus = LibraryStatus.COMPLETED;
    } else if (validCurrent > 0 && currentStatus === LibraryStatus.PLANNING) {
      suggestedStatus = LibraryStatus.WATCHING;
    }

    return {
      currentUnit: validCurrent,
      totalUnits: validTotal,
      percentage,
      isCompleted,
      suggestedStatus
    };
  }

  /**
   * Calculates manga chapter/volume progress without affecting anime counters
   */
  public static calculateMangaProgress(
    currentChapter: number,
    totalChapters: number | null | undefined,
    currentStatus: LibraryStatus
  ): ProgressCalculationResult {
    const validCurrent = Math.max(0, currentChapter);
    const validTotal = totalChapters && totalChapters > 0 ? totalChapters : null;

    let percentage = 0;
    if (validTotal) {
      percentage = Math.min(100, Math.round((validCurrent / validTotal) * 10000) / 100);
    }

    const isCompleted = validTotal !== null && validCurrent >= validTotal;
    let suggestedStatus = currentStatus;

    if (isCompleted && currentStatus !== LibraryStatus.COMPLETED && currentStatus !== LibraryStatus.REREADING) {
      suggestedStatus = LibraryStatus.COMPLETED;
    } else if (validCurrent > 0 && currentStatus === LibraryStatus.PLANNING) {
      suggestedStatus = LibraryStatus.READING;
    }

    return {
      currentUnit: validCurrent,
      totalUnits: validTotal,
      percentage,
      isCompleted,
      suggestedStatus
    };
  }

  /**
   * Performs atomic batch completion for a season or series
   */
  public static batchComplete(totalUnits: number, type: MediaType): {
    currentUnit: number;
    status: LibraryStatus;
    percentage: number;
  } {
    return {
      currentUnit: totalUnits,
      status: type === MediaType.MANGA ? LibraryStatus.COMPLETED : LibraryStatus.COMPLETED,
      percentage: 100.0
    };
  }
}

