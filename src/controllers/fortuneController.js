const fortuneService = require('../services/fortuneService');

// 内存版每日提问次数统计
const askCountMap = new Map(); // key: userId, value: { date: 'YYYY-MM-DD', count: number }

// 获取今日运势
exports.today = async (req, res, next) => {
  try {
    const user = req.user;
    const data = await fortuneService.todayFortune(user);
    res.json({ code: 0, data, message: 'success' });
  } catch (err) {
    next(err);
  }
};

// AI占卜提问
exports.ask = async (req, res, next) => {
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
    const data = await fortuneService.askFortune(user, question);
    record.count += 1;
    askCountMap.set(userId, record);
    res.json({ code: 0, data, message: 'success' });
  } catch (err) {
    next(err);
  }
}; 