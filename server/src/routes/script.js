import { Router } from 'express';
import OpenAI from 'openai';
import prisma from '../lib/prisma.js';

const router = Router();

// Generate script + image prompts from topic
router.post('/generate', async (req, res) => {
  try {
    const { projectId, topic, style } = req.body;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are a YouTube Shorts script writer. Create engaging, hook-driven scripts for 60-second vertical videos.
Output JSON with this structure:
{
  "title": "catchy title for the short",
  "script": "full narration script",
  "scenes": [
    { "order": 1, "text": "narration for this scene", "imagePrompt": "detailed image generation prompt", "duration": 5 }
  ]
}

Rules:
- Start with a strong hook in the first 3 seconds
- Keep total duration around 50-60 seconds
- Split into 5-8 scenes
- Image prompts should be vivid, specific, and suitable for AI image generation
- Style: ${style || 'cinematic, high quality, dramatic lighting'}
- Language: Match the topic language (Korean topic = Korean script)`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Topic: ${topic}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const result = JSON.parse(completion.choices[0].message.content);

    // Save to DB if projectId provided
    if (projectId) {
      // Delete existing scenes
      await prisma.scene.deleteMany({ where: { projectId } });

      // Create new scenes
      const scenes = await Promise.all(
        result.scenes.map((s) =>
          prisma.scene.create({
            data: {
              projectId,
              order: s.order,
              text: s.text,
              imagePrompt: s.imagePrompt,
              duration: s.duration,
            },
          })
        )
      );

      await prisma.project.update({
        where: { id: projectId },
        data: {
          title: result.title,
          script: result.script,
          prompts: result.scenes.map((s) => s.imagePrompt),
          status: 'scripting',
        },
      });

      return res.json({ ...result, scenes, projectId });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update script manually
router.patch('/:projectId', async (req, res) => {
  try {
    const { script, scenes } = req.body;

    if (scenes) {
      await prisma.scene.deleteMany({ where: { projectId: req.params.projectId } });
      await Promise.all(
        scenes.map((s) =>
          prisma.scene.create({
            data: {
              projectId: req.params.projectId,
              order: s.order,
              text: s.text,
              imagePrompt: s.imagePrompt,
              duration: s.duration,
            },
          })
        )
      );
    }

    const project = await prisma.project.update({
      where: { id: req.params.projectId },
      data: { script },
      include: { scenes: { orderBy: { order: 'asc' } } },
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
