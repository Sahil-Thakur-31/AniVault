import { SyncMutationEvent } from '@anivault/shared-types';

export interface QueuedEventRecord {
  event: SyncMutationEvent;
  attempts: number;
  lastAttemptAt?: string;
  status: 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED';
  error?: string;
}

export class OutboxQueueManager {
  private queue: QueuedEventRecord[] = [];
  private maxRetries = 5;

  public enqueue(event: SyncMutationEvent): QueuedEventRecord {
    // Check idempotency by eventId
    const existing = this.queue.find((e) => e.event.eventId === event.eventId);
    if (existing) {
      return existing;
    }

    const record: QueuedEventRecord = {
      event,
      attempts: 0,
      status: 'PENDING'
    };
    this.queue.push(record);
    return record;
  }

  public getPendingEvents(): QueuedEventRecord[] {
    return this.queue.filter((e) => e.status === 'PENDING');
  }

  public markProcessing(eventId: string): void {
    const item = this.queue.find((e) => e.event.eventId === eventId);
    if (item) {
      item.status = 'PROCESSING';
      item.attempts += 1;
      item.lastAttemptAt = new Date().toISOString();
    }
  }

  public markSynced(eventId: string): void {
    const item = this.queue.find((e) => e.event.eventId === eventId);
    if (item) {
      item.status = 'SYNCED';
    }
  }

  public markFailed(eventId: string, error: string): void {
    const item = this.queue.find((e) => e.event.eventId === eventId);
    if (item) {
      item.error = error;
      if (item.attempts >= this.maxRetries) {
        item.status = 'FAILED';
      } else {
        item.status = 'PENDING'; // Can be retried
      }
    }
  }

  public clearSynced(): void {
    this.queue = this.queue.filter((e) => e.status !== 'SYNCED');
  }

  public getAllRecords(): QueuedEventRecord[] {
    return [...this.queue];
  }
}

