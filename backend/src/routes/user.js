const express = require('express');
const { getAdmin } = require('../config/firebase');
const { authMiddleware } = require('../middleware/auth');
const { USERS } = require('../config/collections');

const router = express.Router();
const db = () => getAdmin().firestore();

function defaultPreferences(existing = {}) {
  return {
    default_activity: 'casual',
    mood_selector_enabled: true,
    age: '',
    gender: '',
    height: '',
    weight: '',
    skinTone: 'Medium',
    stylePreference: [],
    comfortPriority: 'comfort',
    ...(existing || {}),
  };
}

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const snap = await db().collection(USERS).doc(userId).get();
    if (!snap.exists) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found', status: 404 },
      });
    }

    const data = snap.data() || {};
    return res.json({
      user_id: userId,
      name: data.name || '',
      email: data.email || '',
      location: data.location || null,
      preferences: defaultPreferences(data.preferences),
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to get profile', status: 500 },
    });
  }
});

router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const updates = req.body || {};
    const ref = db().collection(USERS).doc(userId);
    const current = await ref.get();
    if (!current.exists) {
      return res.status(404).json({
        error: { code: 'USER_NOT_FOUND', message: 'User not found', status: 404 },
      });
    }

    const existing = current.data() || {};
    const next = {
      ...existing,
      updatedAt: new Date().toISOString(),
    };

    if (updates.name != null) next.name = String(updates.name).trim();
    if (updates.location !== undefined) next.location = updates.location;
    if (updates.preferences && typeof updates.preferences === 'object') {
      next.preferences = defaultPreferences({
        ...(existing.preferences || {}),
        ...updates.preferences,
      });
    }

    await ref.set(next, { merge: true });

    return res.json({
      user_id: userId,
      name: next.name || '',
      email: next.email || '',
      location: next.location || null,
      preferences: defaultPreferences(next.preferences),
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to update profile', status: 500 },
    });
  }
});

module.exports = router;
