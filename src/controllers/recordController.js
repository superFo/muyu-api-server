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
  // 移除皮肤掉落逻辑
  const recordId = Array.isArray(result) ? result[0] : null;
  res.json({ code: 0, data: { recordId }, message: 'success' });
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
    if (Math.random() < 0.20 && hiddenSkins.length > 0) { // 总掉落概率20%
      const rand = Math.random();
      let targetSkinId = null;
      if (rand < 0.10) { // 2%/20% = 10%  => 2% 实际概率
        targetSkinId = 2;
      } else {
        targetSkinId = 1; // 18% 实际概率
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