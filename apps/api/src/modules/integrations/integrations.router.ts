import { Router, Request, Response } from 'express';
import { db } from '../../database/db.service.js';
import { getAuthUser } from '../auth/auth.router.js';
import {
  ExternalProvider,
  SyncDirection,
  LibraryStatus
} from '@anivault/shared-types';
import crypto from 'crypto';

const router = Router();

function resolveUserId(req: Request): string {
  const userId = getAuthUser(req);
  if (userId) return userId;
  const firstUser = Array.from(db.users.values())[0];
  return firstUser ? firstUser.id : 'anonymous-user';
}

// List connected accounts
router.get('/', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);
  const accounts = Array.from(db.connectedAccounts.values())
    .filter((a) => a.userId === userId)
    .map((a) => ({
      id: a.id,
      provider: a.provider,
      providerUserId: a.providerUserId,
      providerUsername: a.providerUsername,
      syncDirection: a.syncDirection,
      isSyncEnabled: a.isSyncEnabled,
      lastSyncedAt: a.lastSyncedAt
    }));

  res.json(accounts);
});

// OAuth initiate URL
router.get('/:provider/auth-url', (req: Request, res: Response): void => {
  const provider = String(req.params.provider).toUpperCase();
  const state = crypto.randomBytes(16).toString('hex');

  let authorizationUrl = '';
  if (provider === 'ANILIST') {
    authorizationUrl = `https://anilist.co/api/v2/oauth/authorize?client_id=12345&response_type=code&state=${state}`;
  } else if (provider === 'MYANIMELIST') {
    authorizationUrl = `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=mal_client_id&state=${state}&code_challenge=challenge`;
  } else {
    authorizationUrl = `https://kitsu.io/api/oauth/authorize?client_id=kitsu&response_type=code&state=${state}`;
  }

  res.json({ authorizationUrl, state });
});

// OAuth Callback / Exchange code
router.post('/:provider/callback', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);
  const provider = String(req.params.provider).toUpperCase() as ExternalProvider;
  const { code } = req.body;

  const accountId = crypto.randomUUID();
  const sampleUsername = `${provider.toLowerCase()}_otaku_${Math.floor(Math.random() * 1000)}`;

  const connected = {
    id: accountId,
    userId,
    provider,
    providerUserId: `ext_${Math.floor(Math.random() * 900000)}`,
    providerUsername: sampleUsername,
    accessTokenEnc: 'enc_aes256_' + crypto.randomBytes(16).toString('hex'),
    refreshTokenEnc: 'refresh_' + crypto.randomBytes(16).toString('hex'),
    syncDirection: SyncDirection.TWO_WAY,
    isSyncEnabled: true,
    lastSyncedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.connectedAccounts.set(accountId, connected);

  res.status(201).json({
    id: accountId,
    provider,
    username: sampleUsername,
    connected: true
  });
});

// Trigger manual sync
router.post('/:provider/sync', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);
  const provider = String(req.params.provider).toUpperCase() as ExternalProvider;

  // Simulate sync: update lastSyncedAt and randomly create a mock conflict for demonstration
  for (const acc of db.connectedAccounts.values()) {
    if (acc.userId === userId && acc.provider === provider) {
      acc.lastSyncedAt = new Date().toISOString();
      break;
    }
  }

  // Create mock conflict for demonstration if Bleach is in library
  const bleachMedia = Array.from(db.media.values()).find((m) => m.titleRomaji === 'Bleach');
  if (bleachMedia) {
    const conflictId = crypto.randomUUID();
    db.syncConflicts.set(conflictId, {
      id: conflictId,
      userId,
      mediaId: bleachMedia.id,
      mediaTitle: bleachMedia.titleRomaji,
      provider,
      localEpisode: 12,
      localStatus: LibraryStatus.WATCHING,
      localUpdatedAt: new Date(Date.now() - 3600000).toISOString(),
      remoteEpisode: 14,
      remoteStatus: LibraryStatus.WATCHING,
      remoteUpdatedAt: new Date().toISOString(),
      detectedAt: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    provider,
    message: `Synchronisation with ${provider} completed successfully.`
  });
});

// Disconnect account
router.delete('/:provider', (req: Request, res: Response): void => {
  const userId = resolveUserId(req);
  const provider = String(req.params.provider).toUpperCase();

  for (const [id, acc] of db.connectedAccounts.entries()) {
    if (acc.userId === userId && acc.provider === provider) {
      db.connectedAccounts.delete(id);
      break;
    }
  }

  res.json({ success: true });
});

export const integrationsRouter = router;

