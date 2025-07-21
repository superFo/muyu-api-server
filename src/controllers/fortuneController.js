import { todayFortune, askFortune } from '../services/fortuneService.js';
import db from '../config/db.js';
import dayjs from 'dayjs';

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

export async function ask(req, res, next) {
  try {
    const user = req.user;
    const openId = user.open_id;
    const todayStr = dayjs().format('YYYY-MM-DD');
    // 查询用户当前次数和日期
    let [dbUser] = await db('users').where({ open_id: openId }).select('fortune_ask_count', 'fortune_ask_date');
    let count = dbUser?.fortune_ask_count ?? 3;
    let lastDate = dbUser?.fortune_ask_date;
    // 如果不是今天，重置为3
    if (lastDate !== todayStr) {
      count = 3;
      await db('users').where({ open_id: openId }).update({ fortune_ask_count: 3, fortune_ask_date: todayStr });
    }
    if (count <= 0) {
      return res.status(400).json({ code: 400, message: '今日AI占卜次数已用完', leftTimes: 0 });
    }
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ code: 400, message: '问题不能为空', leftTimes: count });
    }
    // 扣减次数
    await db('users').where({ open_id: openId }).update({ fortune_ask_count: count - 1 });
    const data = await askFortune(user, question);
    res.json({ ...data, leftTimes: count - 1 });
  } catch (err) {
    console.error('[fortune/ask] error:', err);
    res.status(500).json({ code: 500, message: err.message || 'AI占卜失败', data: null });
  }
}

export async function askCount(req, res, next) {
  try {
    const user = req.user;
    const openId = user.open_id;
    const todayStr = dayjs().format('YYYY-MM-DD');
    let [dbUser] = await db('users').where({ open_id: openId }).select('fortune_ask_count', 'fortune_ask_date');
    let count = dbUser?.fortune_ask_count ?? 3;
    let lastDate = dbUser?.fortune_ask_date;
    if (lastDate !== todayStr) {
      count = 3;
      await db('users').where({ open_id: openId }).update({ fortune_ask_count: 3, fortune_ask_date: todayStr });
    }
    res.json({ code: 0, leftTimes: count });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取剩余次数失败', leftTimes: 0 });
  }
} 