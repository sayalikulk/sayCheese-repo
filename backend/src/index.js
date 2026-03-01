require('dotenv').config();
const express = require('express');
const { initializeFirebase } = require('./config/firebase');
const authRoutes = require('./routes/auth');

initializeFirebase();

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE_URL || '/api/v1';

app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

app.use(`${API_BASE}/auth`, authRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal server error', status: 500 },
  });
});

app.listen(PORT, () => {
  console.log(`DayAdapt API at http://localhost:${PORT}${API_BASE}`);
});
