import { createRecord as dbCreateRecord, getRecordsByOpenId } from '../models/record.js';

export async function createRecord(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  const { timestamp, device, city, longitude, latitude } = req.body;
  const result = await dbCreateRecord({ open_id, timestamp, device, city, longitude, latitude });
  // knex insert 返回 [id]
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