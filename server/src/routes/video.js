import { Router } from 'express';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import prisma from '../lib/prisma.js';

const router = Router();

// Compose final video from scenes + audio
router.post('/compose', async (req, res) => {
  try {
    const { projectId } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { scenes: { orderBy: { order: 'asc' } } },
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const outputDir = path.join(process.cwd(), 'output', projectId);
    const imagesDir = path.join(outputDir, 'images');

    // Generate SRT subtitles
    const srtPath = path.join(outputDir, 'subtitles.srt');
    const srtContent = generateSRT(project.scenes);
    await writeFile(srtPath, srtContent, 'utf-8');

    // Build FFmpeg concat file
    const concatPath = path.join(outputDir, 'concat.txt');
    const concatContent = project.scenes
      .map((scene) => {
        const imgFile = path.join(imagesDir, `scene_${scene.order}.png`);
        const dur = scene.duration || 5;
        return `file '${imgFile}'\nduration ${dur}`;
      })
      .join('\n');
    // Add last image again (FFmpeg concat demuxer requirement)
    const lastScene = project.scenes[project.scenes.length - 1];
    const lastImg = path.join(imagesDir, `scene_${lastScene.order}.png`);
    await writeFile(concatPath, concatContent + `\nfile '${lastImg}'`, 'utf-8');

    const audioPath = path.join(outputDir, 'narration.mp3');
    const videoPath = path.join(outputDir, 'final.mp4');

    // FFmpeg command: images + audio + subtitles → MP4
    const ffmpegCmd = [
      'ffmpeg -y',
      `-f concat -safe 0 -i "${concatPath}"`,
      existsSync(audioPath) ? `-i "${audioPath}"` : '',
      `-vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,subtitles='${srtPath}':force_style='FontSize=18,PrimaryColour=&Hffffff&,OutlineColour=&H000000&,Outline=2,Alignment=2,MarginV=80'"`,
      '-c:v libx264 -preset medium -crf 23',
      '-pix_fmt yuv420p',
      existsSync(audioPath) ? '-c:a aac -b:a 192k -shortest' : '',
      '-r 30',
      `"${videoPath}"`,
    ]
      .filter(Boolean)
      .join(' ');

    execSync(ffmpegCmd, { stdio: 'pipe', timeout: 300000 });

    const videoUrl = `/output/${projectId}/final.mp4`;

    await prisma.project.update({
      where: { id: projectId },
      data: { videoUrl, status: 'reviewing' },
    });

    res.json({ videoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get video status
router.get('/status/:projectId', async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.projectId },
    select: { status: true, videoUrl: true },
  });
  res.json(project);
});

function generateSRT(scenes) {
  let srt = '';
  let startTime = 0;

  scenes.forEach((scene, i) => {
    const dur = scene.duration || 5;
    const endTime = startTime + dur;

    srt += `${i + 1}\n`;
    srt += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`;
    srt += `${scene.text}\n\n`;

    startTime = endTime;
  });

  return srt;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export default router;
