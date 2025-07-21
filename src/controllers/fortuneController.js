import { todayFortune, askFortune } from '../services/fortuneService.js';

// 内存版每日提问次数统计
const askCountMap = new Map(); // key: userId, value: { date: 'YYYY-MM-DD', count: number }

// 获取今日运势
export async function today(req, res, next) {
  try {
    const user = req.user;
    const data = await todayFortune(user);
    res.json({ code: 0, data, message: 'success' });
  } catch (err) {
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
      return res.status(400).json({ code: 400, message: '今日提问次数已用完，每日最多3次', data: null });
    }
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ code: 400, message: '问题不能为空', data: null });
    }
    const data = await askFortune(user, question);
    record.count += 1;
    askCountMap.set(userId, record);
    res.json({ code: 0, data, message: 'success' });
  } catch (err) {
    next(err);
  }
} 