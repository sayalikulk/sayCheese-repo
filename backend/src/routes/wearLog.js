const express = require('express');
const { nanoid } = require('nanoid');
const { getAdmin } = require('../config/firebase');
const { authMiddleware } = require('../middleware/auth');
const { WEAR_LOGS, WARDROBE_ITEMS } = require('../config/collections');

const router = express.Router();
const db = () => getAdmin().firestore();

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

router.post('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const { date, activity, item_ids } = req.body || {};
    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'item_ids is required', status: 400 },
      });
    }

    const logId = `log_${nanoid(12)}`;
    const logDate = /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) ? String(date) : todayDate();
    const payload = {
      userId,
      date: logDate,
      activity: activity ? String(activity) : null,
      itemIds: item_ids.map(String),
      createdAt: new Date().toISOString(),
    };

    await db().collection(WEAR_LOGS).doc(logId).set(payload);

    // Best-effort wardrobe counters update
    const batch = db().batch();
    const itemsSnap = await db().collection(WARDROBE_ITEMS).where('userId', '==', userId).get();
    const byId = new Map(itemsSnap.docs.map((d) => [d.id, d]));
    item_ids.forEach((idRaw) => {
      const id = String(idRaw);
      const doc = byId.get(id);
      if (!doc) return;
      const cur = doc.data() || {};
      batch.update(doc.ref, {
        lastWornDate: logDate,
        timesWornLast7Days: Number(cur.timesWornLast7Days || 0) + 1,
        timesWornLast30Days: Number(cur.timesWornLast30Days || 0) + 1,
      });
    });
    await batch.commit();

    return res.status(201).json({
      log_id: logId,
      date: logDate,
      items_logged: item_ids.length,
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to log wear', status: 500 },
    });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const from = req.query.from ? String(req.query.from) : null;
    const to = req.query.to ? String(req.query.to) : null;
    const itemId = req.query.item_id ? String(req.query.item_id) : null;

    let ref = db().collection(WEAR_LOGS).where('userId', '==', userId);
    if (from) ref = ref.where('date', '>=', from);
    if (to) ref = ref.where('date', '<=', to);
    ref = ref.orderBy('date', 'desc');

    const logs = await ref.get();
    const entries = logs.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((e) => !itemId || (Array.isArray(e.itemIds) && e.itemIds.includes(itemId)));

    const itemsSnap = await db().collection(WARDROBE_ITEMS).where('userId', '==', userId).get();
    const names = new Map(itemsSnap.docs.map((d) => [d.id, d.data().name || 'Item']));

    return res.json({
      entries: entries.map((e) => ({
        log_id: e.id,
        date: e.date,
        activity: e.activity || null,
        items: (e.itemIds || []).map((id) => ({ item_id: id, name: names.get(id) || 'Item' })),
      })),
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to load wear logs', status: 500 },
    });
  }
});

module.exports = router;
