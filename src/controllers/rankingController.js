import { getRankingByType } from '../models/record.js';
import { findUsersByOpenIds } from '../models/user.js';

export async function getRankings(req, res) {
  const { type = 'total', limit = 100 } = req.query;
  let openIds = req.query.openIds || req.body?.openIds;
  if (typeof openIds === 'string') {
    try {
      openIds = JSON.parse(openIds);
    } catch {
      openIds = openIds.split(',');
    }
  }
  if (!Array.isArray(openIds)) openIds = null;
  const ranking = await getRankingByType(type, Number(limit), openIds);
  const openIdList = ranking.map(r => r.open_id);
  const users = await findUsersByOpenIds(openIdList);
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