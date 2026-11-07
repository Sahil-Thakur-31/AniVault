import { Router, Request, Response } from 'express';
import { db } from '../../database/db.service.js';
import { getAuthUser } from '../auth/auth.router.js';
import { ConflictResolver } from '@anivault/sync-engine';
import { ConflictStrategy, SyncMutationEvent } from '@anivault/shared-types';

const router = Router();

function resolveUserId(req: Request): string {
  const userId = getAuthUser(req);
  if (userId) return userId;
  const firstUser = Array.from(db.users.values())[0];
  return firstUser ? firstUser.id : 'anonymous-user';
}

// Ingest offline batched mutation events
router.post('/events/batch', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);
  const events = (req.body.events as SyncMutationEvent[]) || [];

  let processed = 0;
  for (const event of events) {
    // Process event locally
    db.userActivity.unshift({
      id: event.eventId,
      userId,
      mediaId: event.mediaId,
      eventType: event.type,
      fieldChanged: event.field,
      oldValue: String(event.oldValue),
      newValue: String(event.newValue),
      sourceClient: event.sourceClient || 'MOBILE_OFFLINE',
      createdAt: event.createdAt || new Date().toISOString()
    });
    processed++;
  }

  res.json({ processed, rejected: 0 });
});

// List unresolved conflicts
router.get('/conflicts', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);
  const conflicts = Array.from(db.syncConflicts.values()).filter((c) => c.userId === userId);
  res.json(conflicts);
});

// Resolve a conflict
router.post('/conflicts/resolve', (req: Request, res: Response): void => {
  const { conflictId, strategy, customEpisode } = req.body;
  const conflict = db.syncConflicts.get(conflictId);

  if (!conflict) {
    res.status(404).json({ message: 'Conflict not found' });
    return;
  }

  const comparison = {
    mediaId: conflict.mediaId,
    localEpisode: conflict.localEpisode,
    localStatus: conflict.localStatus,
    localTimestamp: conflict.localUpdatedAt,
    remoteEpisode: conflict.remoteEpisode,
    remoteStatus: conflict.remoteStatus,
    remoteTimestamp: conflict.remoteUpdatedAt,
    provider: conflict.provider
  };

  const resolution = ConflictResolver.evaluateAndResolve(
    comparison,
    strategy as ConflictStrategy
  );

  // Apply to local library if required
  if (resolution.requiresLocalUpdate || customEpisode !== undefined) {
    const finalEpisode = customEpisode !== undefined ? customEpisode : resolution.resolvedEpisode;
    for (const lib of db.userLibrary.values()) {
      if (lib.userId === conflict.userId && lib.mediaId === conflict.mediaId) {
        const prog = db.userProgress.get(lib.id);
        if (prog) {
          prog.currentEpisode = finalEpisode;
          prog.updatedAt = new Date().toISOString();
        }
        break;
      }
    }
  }

  // Remove resolved conflict
  db.syncConflicts.delete(conflictId);

  res.json({
    success: true,
    resolution
  });
});

export const syncRouter = router;

