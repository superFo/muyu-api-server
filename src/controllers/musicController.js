import { getAllMusic, getMusicById } from '../models/music.js';
import { getUserMusic, addUserMusic, findUserMusic } from '../models/userMusic.js';
import { findByOpenId } from '../models/user.js';

// 获取所有音乐及用户兑换状态
export async function getMusicList(ctx) {
  const open_id = ctx.state.user.open_id;
  const allMusic = await getAllMusic();
  const userMusic = await getUserMusic(open_id);
  const ownedIds = new Set(userMusic.map(m => m.music_id));
  ctx.body = {
    code: 0,
    data: allMusic.map(m => ({ ...m, owned: ownedIds.has(m.id) })),
    message: 'success'
  };
}

// 获取用户已兑换音乐
export async function getMyMusic(ctx) {
  const open_id = ctx.state.user.open_id;
  const userMusic = await getUserMusic(open_id);
  if (!userMusic.length) {
    ctx.body = { code: 0, data: [], message: 'success' };
    return;
  }
  // 查找音乐详情
  const ids = userMusic.map(m => m.music_id);
  const allMusic = await getAllMusic();
  const myMusic = allMusic.filter(m => ids.includes(m.id) || m.is_default);
  ctx.body = { code: 0, data: myMusic, message: 'success' };
}

// 兑换音乐
export async function exchangeMusic(ctx) {
  const open_id = ctx.state.user.open_id;
  const { music_id } = ctx.request.body;
  if (!music_id) {
    ctx.body = { code: 400, message: '参数缺失' };
    return;
  }
  // 查找音乐
  const music = await getMusicById(music_id);
  if (!music) {
    ctx.body = { code: 404, message: '音乐不存在' };
    return;
  }
  if (music.is_default) {
    ctx.body = { code: 400, message: '默认音乐无需兑换' };
    return;
  }
  // 是否已兑换
  const owned = await findUserMusic(open_id, music_id);
  if (owned) {
    ctx.body = { code: 400, message: '已兑换该音乐' };
    return;
  }
  // 获取用户信息
  const user = await findByOpenId(open_id);
  if (!user) {
    ctx.body = { code: 404, message: '用户不存在' };
    return;
  }
  // 计算已消耗额度
  const userMusic = await getUserMusic(open_id);
  const allMusic = await getAllMusic();
  const used = userMusic.reduce((sum, m) => {
    const found = allMusic.find(item => item.id === m.music_id);
    return sum + (found ? found.required_hits : 0);
  }, 0);
  const available = user.month_count - used;
  if (available < music.required_hits) {
    ctx.body = { code: 400, message: '本月敲击次数不足，无法兑换该音乐' };
    return;
  }
  // 兑换
  await addUserMusic(open_id, music_id);
  ctx.body = { code: 0, message: '兑换成功' };
} 