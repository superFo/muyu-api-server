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
  console.log('[皮肤掉落] 开始判定');
  const allSkins = await getAllSkins();
  // 只考虑隐藏皮肤
  const hiddenSkins = allSkins.filter(s => s.is_hidden);
  // 先判定是否掉落（10%）
  if (Math.random() < 0.10 && hiddenSkins.length > 0) {
    // 2% 掉落水晶木鱼（id=2），8% 掉落七彩木鱼（id=1）
    const rand = Math.random();
    let targetSkinId = null;
    if (rand < 0.005) {
      // 0.5% 概率
      targetSkinId = 2;
    } else {
      // 99.95% 概率
      targetSkinId = 1;
    }
    const skin = hiddenSkins.find(s => s.id === targetSkinId);
    if (skin) {
      const userSkinIds = await getUserSkinIds(open_id);
      console.log('[皮肤掉落] 用户已有皮肤ID:', userSkinIds, '本次掉落皮肤ID:', skin.id);
      if (!userSkinIds.includes(skin.id)) {
        await addUserSkin(open_id, skin.id);
        skinDrop = skin;
        console.log('[皮肤掉落] 掉落成功:', skin);
      } else {
        console.log('[皮肤掉落] 用户已拥有该皮肤');
      }
    }
  }
  console.log('[皮肤掉落] 最终skinDrop:', skinDrop);
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

export async function batchCreateRecords(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  const records = Array.isArray(req.body.records) ? req.body.records : [];
  if (!records.length) return res.json({ code: 400, message: 'records 不能为空' });
  // 字段处理，与单条一致
  const formattedRecords = records.map(r => ({
    open_id,
    timestamp: formatDateToMySQL(r.timestamp),
    device: r.device,
    city: r.city,
    longitude: r.longitude,
    latitude: r.latitude
  }));
  try {
    await dbCreateRecord(formattedRecords); // 支持批量插入
    // 皮肤掉落逻辑（只判定一次，和单条一致）
    let skinDrop = null;
    const allSkins = await getAllSkins();
    const hiddenSkins = allSkins.filter(s => s.is_hidden);
    if (Math.random() < 0.10 && hiddenSkins.length > 0) {
      const rand = Math.random();
      let targetSkinId = null;
      if (rand < 0.005) {
        targetSkinId = 2;
      } else {
        targetSkinId = 1;
      }
      const skin = hiddenSkins.find(s => s.id === targetSkinId);
      if (skin) {
        const userSkinIds = await getUserSkinIds(open_id);
        if (!userSkinIds.includes(skin.id)) {
          await addUserSkin(open_id, skin.id);
          skinDrop = skin;
        }
      }
    }
    res.json({ code: 0, data: { count: formattedRecords.length, skinDrop }, message: 'success' });
  } catch (e) {
    res.status(500).json({ code: 500, message: '批量写入失败', error: e.message });
  }
} 