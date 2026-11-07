import { RatingSystem } from '@anivault/shared-types';

export class RatingConverter {
  /**
   * Normalizes any rating score into standard 10-point decimal (0.0 - 10.0)
   */
  public static normalizeToTenPoint(score: number, fromSystem: RatingSystem): number {
    if (score <= 0) return 0;

    switch (fromSystem) {
      case RatingSystem.POINT_100:
        return Math.round((score / 10) * 10) / 10;
      case RatingSystem.POINT_5_STAR:
        return Math.min(10, Math.round(score * 2 * 10) / 10);
      case RatingSystem.SMILEY_3:
        if (score <= 1) return 3.0; // Dissatisfied
        if (score === 2) return 6.5; // Neutral
        return 9.5; // Satisfied
      case RatingSystem.POINT_10_DECIMAL:
      default:
        return Math.min(10, Math.max(0, Math.round(score * 10) / 10));
    }
  }

  /**
   * Converts 10-point normalized score into target display format
   */
  public static convertFromTenPoint(tenPointScore: number, targetSystem: RatingSystem): number {
    switch (targetSystem) {
      case RatingSystem.POINT_100:
        return Math.round(tenPointScore * 10);
      case RatingSystem.POINT_5_STAR:
        return Math.round((tenPointScore / 2) * 2) / 2; // e.g. 4.5
      case RatingSystem.SMILEY_3:
        if (tenPointScore < 5) return 1;
        if (tenPointScore < 8) return 2;
        return 3;
      case RatingSystem.POINT_10_DECIMAL:
      default:
        return tenPointScore;
    }
  }
}

