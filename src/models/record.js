import db from '../config/db.js';

export async function createRecord(record) {
  return db('records').insert(record);
}

export async function getRecordsByOpenId(open_id, { page = 1, pageSize = 10 } = {}) {
  // 联查 user_music 和 music 表，exchanged_at 用 DATE_FORMAT 保证为字符串
  const list = await db('user_music as um')
    .leftJoin('music as m', 'um.music_id', 'm.id')
    .where('um.open_id', open_id)
    .select(
      'um.id',
      'um.music_id',
      db.raw("DATE_FORMAT(um.exchanged_at, '%Y-%m-%d %H:%i:%s') as exchanged_at"),
      'm.name as music_name'
    )
    .orderBy('um.exchanged_at', 'desc')
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [{ count }] = await db('user_music').where({ open_id }).count({ count: '*' });
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