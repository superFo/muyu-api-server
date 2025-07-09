import { getUserStatsWithAvailableHits } from '../models/record.js';

export async function getStats(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  const stats = await getUserStatsWithAvailableHits(open_id);
  res.json({ code: 0, data: stats, message: 'success' });
} 