require('dotenv').config();
const express = require('express');
const { initializeFirebase } = require('./config/firebase');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const wardrobeRoutes = require('./routes/wardrobe');
const wearLogRoutes = require('./routes/wearLog');
const insightsRoutes = require('./routes/insights');
const recommendationsRoutes = require('./routes/recommendations');

initializeFirebase();

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE_URL || '/api/v1';

app.use(express.json());

// CORS: allow dev origins + Cloud Run + CORS_ORIGINS env
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
const isAllowedOrigin = (origin) => {
  if (!origin) return false;
  // Dev / local
  if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin)) return true;
  // Cloud Run domains (e.g. service-123.us-central1.run.app or service-123-uc.a.run.app)
  if (/^https:\/\/[^/]+\.run\.app$/.test(origin)) return true;
  if (/^https:\/\/[^/]+\.a\.run\.app$/.test(origin)) return true;
  // Explicit list from env
  if (CORS_ORIGINS.includes(origin)) return true;
  return false;
};

app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }
  return next();
});

app.get('/health', (_, res) => res.json({ ok: true }));

app.use(`${API_BASE}/auth`, authRoutes);
app.use(`${API_BASE}/user`, userRoutes);
app.use(`${API_BASE}/wardrobe`, wardrobeRoutes);
app.use(`${API_BASE}/wear-log`, wearLogRoutes);
app.use(`${API_BASE}/insights`, insightsRoutes);
app.use(`${API_BASE}/recommendations`, recommendationsRoutes);

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Image must be 10MB or less', status: 400 },
    });
  }
  if (err.message && err.message.includes('images allowed')) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: err.message, status: 400 },
    });
  }
  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal server error', status: 500 },
  });
});

app.listen(PORT, () => {
  console.log(`DayAdapt API at http://localhost:${PORT}${API_BASE}`);
});
