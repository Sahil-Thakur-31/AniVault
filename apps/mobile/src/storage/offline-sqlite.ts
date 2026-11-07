import { SyncMutationEvent, UserLibrary } from '@anivault/shared-types';
import { OutboxQueueManager } from '@anivault/sync-engine';

export class MobileOfflineStorage {
  private outboxManager = new OutboxQueueManager();
  private localLibraryCache: Map<string, UserLibrary> = new Map();

  public cacheLibrary(items: UserLibrary[]): void {
    this.localLibraryCache.clear();
    for (const item of items) {
      this.localLibraryCache.set(item.id, item);
    }
  }

  public getCachedLibrary(): UserLibrary[] {
    return Array.from(this.localLibraryCache.values());
  }

  /**
   * Optimistic update executed immediately (<16ms)
   */
  public mutateProgressOptimistic(
    libraryId: string,
    delta: number
  ): { item: UserLibrary; event: SyncMutationEvent } {
    const item = this.localLibraryCache.get(libraryId);
    if (!item || !item.progress) {
      throw new Error('Item not in cache');
    }

    const isManga = item.media?.type === 'MANGA';
    const oldVal = isManga ? item.progress.currentChapter : item.progress.currentEpisode;
    const newVal = Math.max(0, oldVal + delta);

    if (isManga) {
      item.progress.currentChapter = newVal;
    } else {
      item.progress.currentEpisode = newVal;
    }

    const event: SyncMutationEvent = {
      eventId: 'evt_' + Math.random().toString(36).substring(2, 9),
      userId: item.userId,
      mediaId: item.mediaId,
      type: 'PROGRESS_UPDATED',
      field: isManga ? 'current_chapter' : 'current_episode',
      oldValue: oldVal,
      newValue: newVal,
      createdAt: new Date().toISOString(),
      sourceClient: 'MOBILE_WIDGET'
    };

    this.outboxManager.enqueue(event);
    return { item, event };
  }

  public getPendingOutboxEvents(): SyncMutationEvent[] {
    return this.outboxManager.getPendingEvents().map((e) => e.event);
  }

  public markEventsSynced(eventIds: string[]): void {
    for (const id of eventIds) {
      this.outboxManager.markSynced(id);
    }
    this.outboxManager.clearSynced();
  }
}

export const mobileStorage = new MobileOfflineStorage();

