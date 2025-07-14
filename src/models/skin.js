import db from '../config/db.js';

// 获取所有皮肤
export async function getAllSkins() {
  return db('skins').select('*');
}

// 获取用户拥有的皮肤id列表
export async function getUserSkinIds(open_id) {
  return db('user_skins').where({ open_id }).pluck('skin_id');
}

// 获取用户拥有的皮肤详细信息，字段类型转换为数字
export async function getUserSkins(open_id) {
  const rows = await db('user_skins')
    .join('skins', 'user_skins.skin_id', 'skins.id')
    .where('user_skins.open_id', open_id)
    .select('skins.*', 'user_skins.obtained_at');
  // 类型转换，防止前端渲染异常
  return rows.map(row => ({
    ...row,
    id: Number(row.id),
    is_hidden: Number(row.is_hidden),
    skin_id: row.skin_id ? Number(row.skin_id) : undefined
  }));
}

// 用户获得新皮肤
export async function addUserSkin(open_id, skin_id) {
  return db('user_skins').insert({ open_id, skin_id });
}

// 设置用户当前皮肤
export async function setUserCurrentSkin(open_id, skin_id) {
  return db('users').where({ open_id }).update({ current_skin_id: skin_id });
}

// 获取用户当前皮肤
export async function getUserCurrentSkin(open_id) {
  return db('users').where({ open_id }).first().then(u => u?.current_skin_id);
} 