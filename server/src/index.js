import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projects.js';
import scriptRoutes from './routes/script.js';
import ttsRoutes from './routes/tts.js';
import imageRoutes from './routes/image.js';
import videoRoutes from './routes/video.js';
import youtubeRoutes from './routes/youtube.js';
import settingsRoutes from './routes/settings.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static('uploads'));
app.use('/output', express.static('output'));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/script', scriptRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
