import { Router } from 'express';
import { google } from 'googleapis';
import { createReadStream } from 'fs';
import path from 'path';
import prisma from '../lib/prisma.js';

const router = Router();

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_REDIRECT_URI
  );
}

// Get auth URL
router.get('/auth-url', (req, res) => {
  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.upload'],
  });
  res.json({ url });
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(req.query.code);

    // Store tokens in DB
    await prisma.apiKey.upsert({
      where: { service: 'youtube' },
      update: { key: JSON.stringify(tokens) },
      create: { service: 'youtube', key: JSON.stringify(tokens) },
    });

    res.redirect(`${process.env.CLIENT_URL}?youtube=connected`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload video to YouTube (as private)
router.post('/upload', async (req, res) => {
  try {
    const { projectId, title, description, tags } = req.body;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project?.videoUrl) return res.status(400).json({ error: 'No video to upload' });

    const tokenRecord = await prisma.apiKey.findUnique({ where: { service: 'youtube' } });
    if (!tokenRecord) return res.status(401).json({ error: 'YouTube not authenticated' });

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials(JSON.parse(tokenRecord.key));

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    const videoPath = path.join(process.cwd(), project.videoUrl);

    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title || project.title,
          description: description || `Created with GenerYouShot\n\n#Shorts`,
          tags: tags || ['shorts'],
          categoryId: '22',
        },
        status: {
          privacyStatus: 'private', // Always upload as private first
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: createReadStream(videoPath),
      },
    });

    const youtubeId = response.data.id;

    await prisma.project.update({
      where: { id: projectId },
      data: { youtubeId, status: 'published' },
    });

    res.json({
      youtubeId,
      url: `https://youtube.com/shorts/${youtubeId}`,
      note: 'Uploaded as PRIVATE. Review in YouTube Studio before publishing.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check auth status
router.get('/status', async (req, res) => {
  const tokenRecord = await prisma.apiKey.findUnique({ where: { service: 'youtube' } });
  res.json({ authenticated: !!tokenRecord });
});

export default router;
