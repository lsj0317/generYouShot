import { Router } from 'express';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import prisma from '../lib/prisma.js';

const router = Router();

// Generate images for all scenes
router.post('/generate', async (req, res) => {
  try {
    const { projectId } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { scenes: { orderBy: { order: 'asc' } } },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const outputDir = path.join(process.cwd(), 'output', projectId, 'images');
    if (!existsSync(outputDir)) await mkdir(outputDir, { recursive: true });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const results = [];

    for (const scene of project.scenes) {
      if (!scene.imagePrompt) continue;

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: `${scene.imagePrompt}. Vertical format 9:16, YouTube Shorts style.`,
        n: 1,
        size: '1024x1792',
        quality: 'hd',
      });

      const imageUrl = response.data[0].url;

      // Download and save locally
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const imagePath = path.join(outputDir, `scene_${scene.order}.png`);
      await writeFile(imagePath, imageBuffer);

      const localUrl = `/output/${projectId}/images/scene_${scene.order}.png`;

      await prisma.scene.update({
        where: { id: scene.id },
        data: { imageUrl: localUrl },
      });

      results.push({ sceneId: scene.id, order: scene.order, imageUrl: localUrl });
    }

    res.json({ images: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Regenerate single scene image
router.post('/regenerate/:sceneId', async (req, res) => {
  try {
    const scene = await prisma.scene.findUnique({ where: { id: req.params.sceneId } });
    if (!scene) return res.status(404).json({ error: 'Scene not found' });

    const prompt = req.body.imagePrompt || scene.imagePrompt;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${prompt}. Vertical format 9:16, YouTube Shorts style.`,
      n: 1,
      size: '1024x1792',
      quality: 'hd',
    });

    const imageUrl = response.data[0].url;
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const outputDir = path.join(process.cwd(), 'output', scene.projectId, 'images');
    if (!existsSync(outputDir)) await mkdir(outputDir, { recursive: true });

    const imagePath = path.join(outputDir, `scene_${scene.order}.png`);
    await writeFile(imagePath, imageBuffer);

    const localUrl = `/output/${scene.projectId}/images/scene_${scene.order}.png`;

    await prisma.scene.update({
      where: { id: scene.id },
      data: { imageUrl: localUrl, imagePrompt: prompt },
    });

    res.json({ imageUrl: localUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
