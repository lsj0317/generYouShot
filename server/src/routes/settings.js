import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// Get all API key configs (masked)
router.get('/api-keys', async (req, res) => {
  try {
    const keys = await prisma.apiKey.findMany();
    const masked = keys.map((k) => ({
      ...k,
      key: k.key.substring(0, 8) + '...' + k.key.substring(k.key.length - 4),
    }));
    res.json(masked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save or update API key
router.put('/api-keys/:service', async (req, res) => {
  try {
    const { key, extra } = req.body;
    const record = await prisma.apiKey.upsert({
      where: { service: req.params.service },
      update: { key, extra },
      create: { service: req.params.service, key, extra },
    });
    res.json({ id: record.id, service: record.service });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete API key
router.delete('/api-keys/:service', async (req, res) => {
  try {
    await prisma.apiKey.delete({ where: { service: req.params.service } });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
