import { Router, Request, Response } from 'express';
import { db } from '../../database/db.service.js';
import { createMediaSchema, createMediaRelationshipSchema, addExternalIdSchema } from '@anivault/validation';
import { MediaType, MediaFormat, AiringStatus } from '@anivault/shared-types';
import crypto from 'crypto';

const router = Router();

// Search & filter media
router.get('/', (req: Request, res: Response): void => {
  const q = ((req.query.q as string) || '').toLowerCase();
  const type = req.query.type as MediaType | undefined;
  const format = req.query.format as MediaFormat | undefined;
  const status = req.query.status as AiringStatus | undefined;

  let list = Array.from(db.media.values());

  if (q) {
    list = list.filter(
      (m) =>
        m.titleRomaji.toLowerCase().includes(q) ||
        (m.titleEnglish && m.titleEnglish.toLowerCase().includes(q)) ||
        (m.titleNative && m.titleNative.toLowerCase().includes(q))
    );
  }

  if (type) {
    list = list.filter((m) => m.type === type);
  }
  if (format) {
    list = list.filter((m) => m.format === format);
  }
  if (status) {
    list = list.filter((m) => m.status === status);
  }

  res.json({ data: list, total: list.length });
});

// Create media
router.post('/', (req: Request, res: Response): void => {
  try {
    const validated = createMediaSchema.parse(req.body);
    const id = crypto.randomUUID();

    const newMedia = {
      id,
      franchiseId: validated.franchiseId || null,
      type: validated.type,
      format: validated.format,
      titleRomaji: validated.titleRomaji,
      titleEnglish: validated.titleEnglish || null,
      titleNative: validated.titleNative || null,
      synopsis: validated.synopsis || null,
      coverImageUrl: validated.coverImageUrl || null,
      bannerImageUrl: validated.bannerImageUrl || null,
      status: validated.status,
      startDate: validated.startDate || null,
      endDate: validated.endDate || null,
      totalEpisodes: validated.totalEpisodes || null,
      totalChapters: validated.totalChapters || null,
      totalVolumes: validated.totalVolumes || null,
      durationMinutes: validated.durationMinutes || null,
      genres: validated.genres,
      studios: validated.studios,
      isAdult: validated.isAdult,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.media.set(id, newMedia);
    res.status(201).json(newMedia);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Get media by ID with relationships and external IDs
router.get('/:id', (req: Request, res: Response): void => {
  const mediaId = String(req.params.id);
  const media = db.media.get(mediaId);
  if (!media) {
    res.status(404).json({ message: 'Media not found' });
    return;
  }

  // Gather relationships
  const relationships = Array.from(db.mediaRelationships.values())
    .filter((r) => r.sourceMediaId === media.id)
    .map((r) => ({
      ...r,
      targetMedia: db.media.get(r.targetMediaId)
    }));

  // Gather external IDs
  const externalIds = Array.from(db.mediaExternalIds.values()).filter(
    (e) => e.mediaId === media.id
  );

  // Gather episodes
  const episodes = Array.from(db.episodes.values()).filter((e) => e.mediaId === media.id);

  res.json({
    ...media,
    relationships,
    externalIds,
    episodes
  });
});

// Add relationship
router.post('/:id/relationships', (req: Request, res: Response): void => {
  try {
    const sourceMediaId = String(req.params.id);
    if (!db.media.has(sourceMediaId)) {
      res.status(404).json({ message: 'Source media not found' });
      return;
    }

    const validated = createMediaRelationshipSchema.parse(req.body);
    if (!db.media.has(validated.targetMediaId)) {
      res.status(404).json({ message: 'Target media not found' });
      return;
    }

    const id = crypto.randomUUID();
    const rel = {
      id,
      sourceMediaId,
      targetMediaId: validated.targetMediaId,
      relationshipType: validated.relationshipType,
      isCanonical: validated.isCanonical,
      notes: validated.notes || null,
      createdAt: new Date().toISOString()
    };

    db.mediaRelationships.set(id, rel);
    res.status(201).json(rel);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Add external ID mapping
router.post('/:id/external-ids', (req: Request, res: Response): void => {
  try {
    const mediaId = String(req.params.id);
    if (!db.media.has(mediaId)) {
      res.status(404).json({ message: 'Media not found' });
      return;
    }

    const validated = addExternalIdSchema.parse(req.body);
    const id = crypto.randomUUID();
    const extId = {
      id,
      mediaId,
      provider: validated.provider,
      externalId: validated.externalId,
      externalUrl: validated.externalUrl || null,
      lastVerifiedAt: new Date().toISOString()
    };

    db.mediaExternalIds.set(id, extId);
    res.status(201).json(extId);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export const mediaRouter = router;

