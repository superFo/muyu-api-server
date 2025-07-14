import { createRecord as dbCreateRecord, getRecordsByOpenId } from '../models/record.js';
import { getAllSkins, getUserSkinIds, addUserSkin } from '../models/skin.js';

function formatDateToMySQL(dt) {
  const date = new Date(dt);
  const pad = n => n < 10 ? '0' + n : n;
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export async function createRecord(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  const { timestamp, device, city, longitude, latitude } = req.body;
  const formattedTimestamp = formatDateToMySQL(timestamp);
  const result = await dbCreateRecord({ open_id, timestamp: formattedTimestamp, device, city, longitude, latitude });
  // 皮肤掉落逻辑
  let skinDrop = null;
  if (Math.random() < 0.9) { // 90%概率（调试用）
    // 查询所有隐藏皮肤
    const allSkins = await getAllSkins();
    const hiddenSkins = allSkins.filter(s => s.is_hidden);
    if (hiddenSkins.length > 0) {
      // 随机选一个隐藏皮肤
      const skin = hiddenSkins[Math.floor(Math.random() * hiddenSkins.length)];
      // 查询用户已拥有皮肤
      const userSkinIds = await getUserSkinIds(open_id);
      if (!userSkinIds.includes(skin.id)) {
        await addUserSkin(open_id, skin.id);
        skinDrop = skin;
      }
    }
  }
  const recordId = Array.isArray(result) ? result[0] : null;
  res.json({ code: 0, data: { recordId, skinDrop }, message: 'success' });
}

export async function getRecords(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  const { page = 1, pageSize = 10 } = req.query;
  const result = await getRecordsByOpenId(open_id, { page: Number(page), pageSize: Number(pageSize) });
  res.json({ code: 0, data: result, message: 'success' });
} 