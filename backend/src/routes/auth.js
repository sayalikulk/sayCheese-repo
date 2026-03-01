const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const { getAdmin } = require('../config/firebase');
const { USERS } = require('../config/collections');

const router = express.Router();
const db = () => getAdmin().firestore();

function generateUserId() {
  return `usr_${nanoid(12)}`;
}

function createToken(userId) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  if (!secret) throw new Error('JWT_SECRET is required');
  return jwt.sign({ sub: userId }, secret, { expiresIn });
}

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'email and password are required', status: 400 },
      });
    }

    const usersRef = db().collection(USERS);
    const existing = await usersRef.where('email', '==', email.trim().toLowerCase()).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({
        error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.', status: 400 },
      });
    }

    const userId = generateUserId();
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    await usersRef.doc(userId).set({
      email: email.trim().toLowerCase(),
      name: (name || '').trim() || null,
      passwordHash,
      createdAt: now,
      updatedAt: now,
      location: null,
      preferences: null,
    });

    const token = createToken(userId);
    return res.status(201).json({ user_id: userId, token });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      error: { code: 'REGISTRATION_FAILED', message: err.message || 'Registration failed', status: 500 },
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'email and password are required', status: 400 },
      });
    }

    const usersRef = db().collection(USERS);
    const snapshot = await usersRef.where('email', '==', email.trim().toLowerCase()).limit(1).get();
    if (snapshot.empty) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password', status: 401 },
      });
    }

    const doc = snapshot.docs[0];
    const userId = doc.id;
    const { passwordHash } = doc.data();
    const valid = await bcrypt.compare(password, passwordHash);
    if (!valid) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password', status: 401 },
      });
    }

    const token = createToken(userId);
    return res.json({ user_id: userId, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: { code: 'LOGIN_FAILED', message: err.message || 'Login failed', status: 500 },
    });
  }
});

// GET /api/v1/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token', status: 401 },
    });
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, secret);
    const userId = decoded.sub;
    return res.json({ user_id: userId });
  } catch {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token', status: 401 },
    });
  }
});

module.exports = router;
