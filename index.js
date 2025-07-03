const db = require('./src/config/db.js');
const dayjs = require('dayjs');

async function updateUserStats() {
  const users = await db('users').select('open_id');
  const now = dayjs();
  const today = now.format('YYYY-MM-DD');
  const weekStart = now.startOf('week').format('YYYY-MM-DD');
  const monthStart = now.startOf('month').format('YYYY-MM-DD');

  for (const user of users) {
    // 今日
    const [{ todayCount }] = await db('records')
      .where('open_id', user.open_id)
      .andWhere('timestamp', '>=', today + ' 00:00:00')
      .count({ todayCount: '*' });
    // 本周
    const [{ weekCount }] = await db('records')
      .where('open_id', user.open_id)
      .andWhere('timestamp', '>=', weekStart + ' 00:00:00')
      .count({ weekCount: '*' });
    // 本月
    const [{ monthCount }] = await db('records')
      .where('open_id', user.open_id)
      .andWhere('timestamp', '>=', monthStart + ' 00:00:00')
      .count({ monthCount: '*' });

    await db('users')
      .where('open_id', user.open_id)
      .update({
        today_count: todayCount,
        week_count: weekCount,
        month_count: monthCount
      });
  }
  console.log('用户敲击统计聚合完成');
}

// 云函数入口
exports.main = async (event, context) => {
  await updateUserStats();
  return { message: 'ok' };
}; 