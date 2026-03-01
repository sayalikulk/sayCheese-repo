const express = require('express');
const { getAdmin } = require('../config/firebase');
const { authMiddleware } = require('../middleware/auth');
const { WEAR_LOGS, WARDROBE_ITEMS } = require('../config/collections');

const router = express.Router();
const db = () => getAdmin().firestore();

function dateOnly(d) {
  return d.toISOString().slice(0, 10);
}

router.get('/wardrobe-utilization', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const period = req.query.period === 'week' ? 'week' : 'month';
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - (period === 'week' ? 6 : 29));

    const fromStr = dateOnly(from);
    const toStr = dateOnly(to);

    const [wearLogsSnap, wardrobeSnap] = await Promise.all([
      db()
        .collection(WEAR_LOGS)
        .where('userId', '==', userId)
        .where('date', '>=', fromStr)
        .where('date', '<=', toStr)
        .orderBy('date', 'desc')
        .get(),
      db().collection(WARDROBE_ITEMS).where('userId', '==', userId).get(),
    ]);

    const wearCount = new Map();
    const lastWorn = new Map();
    wearLogsSnap.docs.forEach((doc) => {
      const e = doc.data() || {};
      (e.itemIds || []).forEach((id) => {
        wearCount.set(id, Number(wearCount.get(id) || 0) + 1);
        if (!lastWorn.has(id)) lastWorn.set(id, e.date || null);
      });
    });

    const items = wardrobeSnap.docs.map((doc) => ({
      item_id: doc.id,
      name: doc.data().name || 'Item',
      times_worn: Number(wearCount.get(doc.id) || 0),
      last_worn_date: lastWorn.get(doc.id) || null,
    }));

    const totalWears = items.reduce((sum, i) => sum + i.times_worn, 0);
    const unwornCount = items.filter((i) => i.times_worn === 0).length;

    return res.json({
      period,
      from: fromStr,
      to: toStr,
      total_wears: totalWears,
      items,
      summary:
        unwornCount > 0
          ? `${unwornCount} items haven't been worn this ${period}.`
          : `Great rotation this ${period}.`,
    });
  } catch (err) {
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: err.message || 'Failed to load insights', status: 500 },
    });
  }
});

module.exports = router;
