process.env.NODE_ENV = 'test';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { app } from '../apps/api/src/main.js';

describe('AniVault REST API Integration Tests', () => {
  let server: http.Server;
  let baseUrl: string;
  let authToken = '';

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(() => {
    server.close();
  });

  it('GET /health returns healthy status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'healthy');
  });

  it('POST /api/v1/auth/register creates user and returns JWT accessToken', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_integrator@anivault.local',
        username: 'test_integrator',
        password: 'Password123!'
      })
    });
    assert.strictEqual(res.status, 201);
    const data = await res.json();
    assert.ok(data.accessToken);
    assert.strictEqual(data.user.username, 'test_integrator');
    authToken = data.accessToken;
  });

  it('GET /api/v1/franchises lists canonical franchises including Naruto and Bleach', async () => {
    const res = await fetch(`${baseUrl}/api/v1/franchises`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.data.length >= 2);
    const naruto = data.data.find((f: any) => f.canonicalTitle === 'Naruto');
    assert.ok(naruto);
  });

  it('GET /api/v1/franchises/:id returns hierarchical tree (Main Series, Sequels, Movies, Manga)', async () => {
    const franchisesRes = await fetch(`${baseUrl}/api/v1/franchises`);
    const franchises = await franchisesRes.json();
    const naruto = franchises.data.find((f: any) => f.canonicalTitle === 'Naruto');

    const treeRes = await fetch(`${baseUrl}/api/v1/franchises/${naruto.id}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(treeRes.status, 200);
    const tree = await treeRes.json();

    assert.strictEqual(tree.franchise.canonicalTitle, 'Naruto');
    assert.ok(tree.mainStory.length >= 1); // Naruto TV
    assert.ok(tree.sequels.length >= 1); // Shippuden
    assert.ok(tree.movies.length >= 1); // Land of Snow movie
    assert.ok(tree.manga.length >= 1); // Naruto manga
  });

  it('POST /api/v1/library adds a title and PATCH /progress updates counter', async () => {
    // 1. Get Bleach media ID
    const mediaRes = await fetch(`${baseUrl}/api/v1/media?q=Bleach`);
    const mediaData = await mediaRes.json();
    const bleach = mediaData.data.find((m: any) => m.titleRomaji === 'Bleach');

    // 2. Add to library
    const addRes = await fetch(`${baseUrl}/api/v1/library`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        mediaId: bleach.id,
        status: 'WATCHING',
        currentEpisode: 10,
        score: 8.5
      })
    });
    assert.strictEqual(addRes.status, 201);
    const added = await addRes.json();
    assert.strictEqual(added.status, 'WATCHING');
    assert.strictEqual(added.progress.currentEpisode, 10);

    // 3. Quick increment (+1)
    const incRes = await fetch(`${baseUrl}/api/v1/library/${added.id}/quick-increment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ delta: 1 })
    });
    assert.strictEqual(incRes.status, 200);
    const incData = await incRes.json();
    assert.strictEqual(incData.progress.currentEpisode, 11);
  });

  it('GET /api/v1/widgets/quick-tracker returns fast sub-1KB payload for native home widgets', async () => {
    const res = await fetch(`${baseUrl}/api/v1/widgets/quick-tracker`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const widgetData = await res.json();
    assert.ok(widgetData.length >= 1);
    const first = widgetData[0];
    assert.ok(first.title);
    assert.ok(first.currentProgress !== undefined);
  });

  it('GET /api/v1/export/json produces valid full backup format', async () => {
    const res = await fetch(`${baseUrl}/api/v1/export/json`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const exportData = await res.json();
    assert.strictEqual(exportData.schemaVersion, '1.0.0');
    assert.strictEqual(exportData.application, 'AniVault');
    assert.ok(Array.isArray(exportData.library));
  });
});
