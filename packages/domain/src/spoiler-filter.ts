export class SpoilerFilter {
  /**
   * Determines whether an episode's metadata or image should be blurred
   * based on the user's progress and protection level
   */
  public static shouldMaskEpisode(
    targetEpisodeNumber: number,
    userWatchedEpisode: number,
    protectionLevel: 'STRICT' | 'MODERATE' | 'OFF'
  ): { maskSynopsis: boolean; maskThumbnail: boolean; maskTitle: boolean } {
    if (protectionLevel === 'OFF') {
      return { maskSynopsis: false, maskThumbnail: false, maskTitle: false };
    }

    const isAheadOfUser = targetEpisodeNumber > userWatchedEpisode;

    if (!isAheadOfUser) {
      return { maskSynopsis: false, maskThumbnail: false, maskTitle: false };
    }

    if (protectionLevel === 'STRICT') {
      return {
        maskSynopsis: true,
        maskThumbnail: true,
        maskTitle: true
      };
    }

    // MODERATE masks synopsis and thumbnails, but shows generic titles
    return {
      maskSynopsis: true,
      maskThumbnail: true,
      maskTitle: false
    };
  }
}

