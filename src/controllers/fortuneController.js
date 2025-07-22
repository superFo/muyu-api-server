import { todayFortune, askFortune } from '../services/fortuneService.js';
import db from '../config/db.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
dayjs.extend(utc);
dayjs.extend(timezone);

export async function today(req, res, next) {
  try {
    const user = req.user;
    const openId = user.open_id;
    const todayStr = dayjs().format('YYYY-MM-DD');
    // 1. 查缓存表
    let [cache] = await db('fortune_cache').where({ open_id: openId, date: todayStr }).select('fortune_json');
    if (cache && cache.fortune_json) {
      // 兼容 MySQL JSON 字段返回对象或字符串
      const data = typeof cache.fortune_json === 'string'
        ? JSON.parse(cache.fortune_json)
        : cache.fortune_json;
      return res.json({ code: 0, data, message: 'success' });
    }
    // 2. 查用户生日
    let [dbUser] = await db('users').where({ open_id: openId }).select('birth_year', 'birth_month', 'birth_day');
    let hasBirth = dbUser && dbUser.birth_year && dbUser.birth_month && dbUser.birth_day;
    // 3. 生成运势
    let fortune;
    if (hasBirth) {
      fortune = await todayFortune({ ...user, birth_year: dbUser.birth_year, birth_month: dbUser.birth_month, birth_day: dbUser.birth_day });
      // 4. 写入缓存
      await db('fortune_cache').insert({ open_id: openId, date: todayStr, fortune_json: JSON.stringify(fortune) });
    } else {
      // 未填写生日，随机生成但不写入缓存
      fortune = await todayFortune({ ...user, random: true });
    }
    res.json({ code: 0, data: fortune, message: 'success' });
  } catch (err) {
    console.error('[fortune/today] error:', err);
    res.status(500).json({ code: 500, message: err.message || '获取今日运势失败', data: null });
  }
}

export async function ask(req, res, next) {
  try {
    const user = req.user;
    const openId = user.open_id;
    const todayStr = dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD');
    let [dbUser] = await db('users').where({ open_id: openId }).select('fortune_ask_count', 'fortune_ask_date');
    let count = dbUser?.fortune_ask_count ?? 6;
    let lastDate = dbUser?.fortune_ask_date;
    let lastDateStr = lastDate ? dayjs(lastDate).tz('Asia/Shanghai').format('YYYY-MM-DD') : null;
    if (lastDateStr !== todayStr) {
      count = 6;
      await db('users').where({ open_id: openId }).update({ fortune_ask_count: 6, fortune_ask_date: todayStr });
    }
    if (count <= 0) {
      return res.status(400).json({ code: 400, message: '今日AI占卜次数已用完', leftTimes: 0 });
    }
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ code: 400, message: '问题不能为空', leftTimes: count });
    }
    // 先扣减次数的情况
    await db('users').where({ open_id: openId }).update({ fortune_ask_count: count - 1 });
    const data = await askFortune(user, question);
    res.json({ ...data }); // 不再返回leftTimes，由前端维护
  } catch (err) {
    console.error('[fortune/ask] error:', err);
    res.status(500).json({ code: 500, message: err.message || 'AI占卜失败', data: null });
  }
}

export async function askCount(req, res, next) {
  try {
    const user = req.user;
    const openId = user.open_id;
    const todayStr = dayjs().tz('Asia/Shanghai').format('YYYY-MM-DD');
    let [dbUser] = await db('users').where({ open_id: openId }).select('fortune_ask_count', 'fortune_ask_date');
    let count = dbUser?.fortune_ask_count ?? 6;
    let lastDate = dbUser?.fortune_ask_date;
    let lastDateStr = lastDate ? dayjs(lastDate).tz('Asia/Shanghai').format('YYYY-MM-DD') : null;
    if (lastDateStr !== todayStr) {
      count = 6;
      await db('users').where({ open_id: openId }).update({ fortune_ask_count: 6, fortune_ask_date: todayStr });
    }
    res.json({ code: 0, leftTimes: count });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取剩余次数失败', leftTimes: 0 });
  }
} 