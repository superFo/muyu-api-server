import { getRankingByType } from '../models/record.js';
import { findUsersByOpenIds } from '../models/user.js';

export async function getRankings(req, res) {
  const { type = 'total', limit = 100 } = req.query;
  const ranking = await getRankingByType(type, Number(limit));
  const openIds = ranking.map(r => r.open_id);
  const users = await findUsersByOpenIds(openIds);
  const userMap = {};
  users.forEach(u => { userMap[u.open_id] = u; });
  const data = ranking.map(r => ({
    open_id: r.open_id,
    count: Number(r.count),
    nickname: userMap[r.open_id]?.nickname || '',
    avatar: userMap[r.open_id]?.avatar || ''
  }));
  res.json({ code: 0, data, message: 'success' });
} 