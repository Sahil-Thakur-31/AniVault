import { ConflictStrategy, ExternalProvider, LibraryStatus } from '@anivault/shared-types';

export interface ProgressStateComparison {
  mediaId: string;
  localEpisode: number;
  localStatus: LibraryStatus;
  localTimestamp: Date | string;
  remoteEpisode: number;
  remoteStatus: LibraryStatus;
  remoteTimestamp: Date | string;
  provider: ExternalProvider;
}

export interface ConflictResolutionResult {
  hasConflict: boolean;
  resolvedEpisode: number;
  resolvedStatus: LibraryStatus;
  requiresRemotePush: boolean;
  requiresLocalUpdate: boolean;
  reason: string;
}

export class ConflictResolver {
  public static evaluateAndResolve(
    comparison: ProgressStateComparison,
    strategy: ConflictStrategy = ConflictStrategy.ANI_VAULT_MASTER
  ): ConflictResolutionResult {
    // If progress and status are identical, there is no conflict
    if (
      comparison.localEpisode === comparison.remoteEpisode &&
      comparison.localStatus === comparison.remoteStatus
    ) {
      return {
        hasConflict: false,
        resolvedEpisode: comparison.localEpisode,
        resolvedStatus: comparison.localStatus,
        requiresRemotePush: false,
        requiresLocalUpdate: false,
        reason: 'Local and remote states are synchronized.'
      };
    }

    switch (strategy) {
      case ConflictStrategy.ANI_VAULT_MASTER:
        return {
          hasConflict: true,
          resolvedEpisode: comparison.localEpisode,
          resolvedStatus: comparison.localStatus,
          requiresRemotePush: true,
          requiresLocalUpdate: false,
          reason: 'Resolved via ANI_VAULT_MASTER: Local state enforced on remote provider.'
        };

      case ConflictStrategy.REMOTE_PROVIDER_WINS:
        return {
          hasConflict: true,
          resolvedEpisode: comparison.remoteEpisode,
          resolvedStatus: comparison.remoteStatus,
          requiresRemotePush: false,
          requiresLocalUpdate: true,
          reason: `Resolved via REMOTE_PROVIDER_WINS: Remote state from ${comparison.provider} accepted locally.`
        };

      case ConflictStrategy.HIGHEST_PROGRESS:
        if (comparison.localEpisode >= comparison.remoteEpisode) {
          return {
            hasConflict: true,
            resolvedEpisode: comparison.localEpisode,
            resolvedStatus: comparison.localStatus,
            requiresRemotePush: true,
            requiresLocalUpdate: false,
            reason: 'Resolved via HIGHEST_PROGRESS: Local progress is greater or equal.'
          };
        } else {
          return {
            hasConflict: true,
            resolvedEpisode: comparison.remoteEpisode,
            resolvedStatus: comparison.remoteStatus,
            requiresRemotePush: false,
            requiresLocalUpdate: true,
            reason: 'Resolved via HIGHEST_PROGRESS: Remote progress is greater.'
          };
        }

      case ConflictStrategy.MANUAL_HOLD:
      default:
        return {
          hasConflict: true,
          resolvedEpisode: comparison.localEpisode,
          resolvedStatus: comparison.localStatus,
          requiresRemotePush: false,
          requiresLocalUpdate: false,
          reason: 'Manual intervention required. Conflict enqueued for user review.'
        };
    }
  }
}

