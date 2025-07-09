import { getAllMusic, getMusicById } from '../models/music.js';
import { getUserMusic, addUserMusic, findUserMusic } from '../models/userMusic.js';
import { findByOpenId } from '../models/user.js';
import db from '../config/db.js';

// 获取所有音乐及用户兑换状态
export async function getMusicList(req, res) {
  try {
    const open_id = req.user.open_id;
    const allMusic = await getAllMusic();
    const userMusic = await getUserMusic(open_id);
    const ownedIds = new Set(userMusic.map(m => m.music_id));
    res.json({
      code: 0,
      data: allMusic.map(m => ({ ...m, owned: ownedIds.has(m.id) })),
      message: 'success'
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
  }
}

// 获取用户已兑换音乐
export async function getMyMusic(req, res) {
  try {
    const open_id = req.user.open_id;
    const userMusic = await getUserMusic(open_id);
    if (!userMusic.length) {
      res.json({ code: 0, data: [], message: 'success' });
      return;
    }
    // 查找音乐详情
    const ids = userMusic.map(m => m.music_id);
    const allMusic = await getAllMusic();
    const myMusic = allMusic.filter(m => ids.includes(m.id) || m.is_default);
    res.json({ code: 0, data: myMusic, message: 'success' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '服务器错误', error: err.message });
  }
}

// 兑换音乐（原子性处理）
export async function exchangeMusic(req, res) {
  const open_id = req.user.open_id;
  const { music_id } = req.body;
  if (!music_id) {
    res.json({ code: 400, message: '参数缺失' });
    return;
  }
  try {
    await db.transaction(async trx => {
      // 查找音乐
      const music = await trx('music').where({ id: music_id }).first();
      if (!music) throw new Error('音乐不存在');
      if (music.is_default) throw new Error('默认音乐无需兑换');

      // 是否已兑换
      const owned = await trx('user_music').where({ open_id, music_id }).first();
      if (owned) throw new Error('已兑换该音乐');

      // 获取用户信息
      const user = await trx('users').where({ open_id }).first();
      if (!user) throw new Error('用户不存在');

      // SQL 聚合已消耗额度
      const [{ used = 0 }] = await trx('user_music as um')
        .join('music as m', 'um.music_id', 'm.id')
        .where('um.open_id', open_id)
        .sum({ used: 'm.required_hits' });

      const available = user.month_count - used;
      if (available < music.required_hits) {
        throw new Error('本月敲击次数不足，无法兑换该音乐');
      }

      // 兑换
      function formatDateToMySQL(dt) {
        const date = new Date(dt);
        const pad = n => n < 10 ? '0' + n : n;
        return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      }
      await trx('user_music').insert({ open_id, music_id, exchanged_at: formatDateToMySQL(new Date()) });
    });
    res.json({ code: 0, message: '兑换成功' });
  } catch (err) {
    let msg = err.message || '服务器错误';
    let code = 400;
    if (msg === '音乐不存在' || msg === '用户不存在') code = 404;
    res.status(200).json({ code, message: msg });
  }
} 