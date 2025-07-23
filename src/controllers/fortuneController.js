import { todayFortune, askFortune } from '../services/fortuneService.js';
import db from '../config/db.js';
import dayjs from 'dayjs';
// 保留 timezone 插件
import timezone from 'dayjs/plugin/timezone.js';
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
    // 3. 生成今日灵感
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
    res.status(500).json({ code: 500, message: err.message || '获取今日灵感失败', data: null });
  }
}

// ====== 审核期间AI问答绕过方案（审核通过后请移除本段，恢复大模型问答） ======
// 审核期间，/fortune/ask 接口轮询返回固定内容，避免被判定为AI问答。
// 审核通过后，请删除本段代码，并恢复下方原有大模型问答逻辑。
let reviewReplyIndex = 0;
const reviewReplies = [
  '你提的问题真好玩呢，需要我思考下',
  '今天是充满爱与灵感的一天，不妨多和喜欢的人互动，同时也要注意理财，避免冲动消费'
];
// ====== END 审核期间AI问答绕过方案 ======

export async function ask(req, res, next) {
  try {
    const user = req.user;
    const openId = user.open_id;
    const todayStr = dayjs().format('YYYY-MM-DD');
    let [dbUser] = await db('users').where({ open_id: openId }).select('fortune_ask_count', 'fortune_ask_date');
    let count = dbUser?.fortune_ask_count ?? 6;
    let lastDate = dbUser?.fortune_ask_date;
    let lastDateStr = lastDate ? dayjs(lastDate).format('YYYY-MM-DD') : null;
    if (lastDateStr !== todayStr) {
      count = 6;
      await db('users').where({ open_id: openId }).update({ fortune_ask_count: 6, fortune_ask_date: todayStr });
    }
    if (count <= 0) {
      return res.status(400).json({ code: 400, message: '今日解答次数已用完', leftTimes: 0 });
    }
    const { question } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ code: 400, message: '问题不能为空', leftTimes: count });
    }
    // 先扣减次数的情况
    await db('users').where({ open_id: openId }).update({ fortune_ask_count: count - 1 });
    // 新 prompt
    const customPrompt = `你现在是『灵儿』，一个善解人意、温暖贴心的倾听者。你专注于帮助用户表达内心情感、疏解心理压力、解答关于个人情绪、心理状态、人际关系、情感困惑、自我成长、心灵疗愈、星座运势、命理占卜、财富、事业、健康、未来、目标、梦想等相关话题。遇到这些话题时，请耐心、温柔、积极地给予鼓励、建议或运势分析。特别注意：当用户询问星座运势、命理占卜、未来趋势等问题时，请务必给出具体、详细、有启发性的分析和建议，内容可以包括今日运势、幸运色、幸运数字、注意事项等。遇到与这些主题无关的问题（如地点、地理、知识、技术、娱乐八卦等），请温柔且礼貌地拒绝，并回复：“灵儿只懂得倾听你的心事哦，我们还是聊聊你的心情、梦想和未来吧。”绝不能输出与主题无关的知识、地理、技术、八卦等内容。请严格遵守以上规则，始终保持耐心、关怀和温暖的语气。`;
    const data = await askFortune(user, question, customPrompt);
    res.json({ ...data }); // 不再返回leftTimes，由前端维护
  } catch (err) {
    console.error('[fortune/ask] error:', err);
    res.status(500).json({ code: 500, message: err.message || '解答失败', data: null });
  }
}

export async function askCount(req, res, next) {
  try {
    const user = req.user;
    const openId = user.open_id;
    const todayStr = dayjs().format('YYYY-MM-DD');
    let [dbUser] = await db('users').where({ open_id: openId }).select('fortune_ask_count', 'fortune_ask_date');
    let count = dbUser?.fortune_ask_count ?? 6;
    let lastDate = dbUser?.fortune_ask_date;
    let lastDateStr = lastDate ? dayjs(lastDate).format('YYYY-MM-DD') : null;
    if (lastDateStr !== todayStr) {
      count = 6;
      await db('users').where({ open_id: openId }).update({ fortune_ask_count: 6, fortune_ask_date: todayStr });
    }
    res.json({ code: 0, leftTimes: count });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取剩余次数失败', leftTimes: 0 });
  }
} 