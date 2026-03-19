import { Router } from 'express';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import prisma from '../lib/prisma.js';

const router = Router();

// Generate TTS audio from script
router.post('/generate', async (req, res) => {
  try {
    const { projectId, text, provider } = req.body;

    const outputDir = path.join(process.cwd(), 'output', projectId);
    if (!existsSync(outputDir)) await mkdir(outputDir, { recursive: true });

    const audioPath = path.join(outputDir, 'narration.mp3');
    let audioUrl;

    if (provider === 'elevenlabs') {
      audioUrl = await generateElevenLabs(text, audioPath);
    } else {
      audioUrl = await generateOpenAITTS(text, audioPath);
    }

    // Update project
    await prisma.project.update({
      where: { id: projectId },
      data: { audioUrl: `/output/${projectId}/narration.mp3`, status: 'generating' },
    });

    res.json({ audioUrl: `/output/${projectId}/narration.mp3` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function generateOpenAITTS(text, outputPath) {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'onyx',
    input: text,
    speed: 1.0,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
  return outputPath;
}

async function generateElevenLabs(text, outputPath) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
  return outputPath;
}

export default router;
