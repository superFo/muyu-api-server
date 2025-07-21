import { todayFortune, askFortune } from '../services/fortuneService.js';

// 内存版每日提问次数统计
const askCountMap = new Map(); // key: userId, value: { date: 'YYYY-MM-DD', count: number }

// 获取今日运势
export async function today(req, res, next) {
  try {
    const user = req.user;
    console.log('[fortune/today] user:', user);
    const data = await todayFortune(user);
    console.log('[fortune/today] success:', data);
    res.json({ code: 0, data, message: 'success' });
  } catch (err) {
    console.error('[fortune/today] error:', err);
    next(err);
  }
}

// AI占卜提问
export async function ask(req, res, next) {
  try {
    const user = req.user;
    const userId = user.id || user.open_id;
    const today = new Date().toISOString().slice(0, 10);
    let record = askCountMap.get(userId);
    if (!record || record.date !== today) {
      record = { date: today, count: 0 };
    }
    if (record.count >= 3) {
      console.warn('[fortune/ask] 超过提问次数:', userId, record);
      return res.status(400).json({ code: 400, message: '今日提问次数已用完，每日最多3次', data: null });
    }
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      console.warn('[fortune/ask] 问题为空:', req.body);
      return res.status(400).json({ code: 400, message: '问题不能为空', data: null });
    }
    console.log('[fortune/ask] user:', user, 'question:', question);
    const data = await askFortune(user, question);
    record.count += 1;
    askCountMap.set(userId, record);
    console.log('[fortune/ask] success:', data);
    res.json({ code: 0, data, message: 'success' });
  } catch (err) {
    console.error('[fortune/ask] error:', err);
    next(err);
  }
} 