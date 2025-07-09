import db from '../config/db.js';

export async function createRecord(record) {
  return db('records').insert(record);
}

export async function getRecordsByOpenId(open_id, { page = 1, pageSize = 10, date } = {}) {
  const query = db('records').where({ open_id });
  if (date) {
    // date 格式假定为 'YYYY-MM-DD'
    const start = date + ' 00:00:00';
    const end = date + ' 23:59:59';
    query.andWhere('timestamp', '>=', start).andWhere('timestamp', '<=', end);
  }
  const list = await query
    .orderBy('timestamp', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  // 统计总数
  const countQuery = db('records').where({ open_id });
  if (date) {
    countQuery.andWhere('timestamp', '>=', start).andWhere('timestamp', '<=', end);
  }
  const [{ count }] = await countQuery.count({ count: '*' });
  return { total: Number(count), list };
}

export async function getRankingByType(type = 'total', limit = 100, openIds = null) {
  const now = new Date();
  let start;
  if (type === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (type === 'week') {
    const day = now.getDay() || 7;
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
  }
  const query = db('records');
  if (type === 'today' || type === 'week') {
    query.where('timestamp', '>=', start);
  }
  if (openIds && Array.isArray(openIds) && openIds.length > 0) {
    query.whereIn('open_id', openIds);
  }
  return query
    .select('open_id')
    .count({ count: '*' })
    .groupBy('open_id')
    .orderBy('count', 'desc')
    .limit(limit);
}

export async function getUserStatsByOpenId(open_id) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = now.getDay() || 7;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
  // 今日
  const [{ todayCount }] = await db('records')
    .where({ open_id })
    .andWhere('timestamp', '>=', todayStart)
    .count({ todayCount: '*' });
  // 本周
  const [{ weekCount }] = await db('records')
    .where({ open_id })
    .andWhere('timestamp', '>=', weekStart)
    .count({ weekCount: '*' });
  // 总数
  const [{ totalCount }] = await db('records')
    .where({ open_id })
    .count({ totalCount: '*' });
  return {
    todayCount: Number(todayCount),
    weekCount: Number(weekCount),
    totalCount: Number(totalCount)
  };
}

export async function getUserStatsWithAvailableHits(open_id) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = now.getDay() || 7;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);

  // records表统计
  const [{ todayCount }] = await db('records')
    .where({ open_id })
    .andWhere('timestamp', '>=', todayStart)
    .count({ todayCount: '*' });
  const [{ weekCount }] = await db('records')
    .where({ open_id })
    .andWhere('timestamp', '>=', weekStart)
    .count({ weekCount: '*' });
  const [{ totalCount }] = await db('records')
    .where({ open_id })
    .count({ totalCount: '*' });

  // users表聚合
  const user = await db('users').where({ open_id }).first();
  return {
    todayCount: Number(todayCount),
    weekCount: Number(weekCount),
    totalCount: Number(totalCount),
    monthCount: user?.month_count || 0,
    availableHits: user?.available_hits || 0
  };
} 