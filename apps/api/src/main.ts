import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRouter } from './modules/auth/auth.router.js';
import { franchisesRouter } from './modules/franchises/franchises.router.js';
import { mediaRouter } from './modules/media/media.router.js';
import { libraryRouter } from './modules/library/library.router.js';
import { integrationsRouter } from './modules/integrations/integrations.router.js';
import { syncRouter } from './modules/sync/sync.router.js';
import { widgetsRouter } from './modules/widgets/widgets.router.js';
import { importExportRouter } from './modules/import-export/import-export.router.js';
import { statsRouter } from './modules/stats/stats.router.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AniVault Unified API'
  });
});

// Mount /api/v1 routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/franchises', franchisesRouter);
app.use('/api/v1/media', mediaRouter);
app.use('/api/v1/library', libraryRouter);
app.use('/api/v1/integrations', integrationsRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/widgets', widgetsRouter);
app.use('/api/v1', importExportRouter);
app.use('/api/v1/stats', statsRouter);

// Start server only when executed directly
const isDirectRun = process.argv[1] && (process.argv[1].endsWith('main.ts') || process.argv[1].endsWith('main.js'));
if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[AniVault API] Service listening on http://localhost:${PORT}`);
  });
}

export { app };

