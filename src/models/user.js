import db from '../config/db.js';

export async function findByOpenId(open_id) {
  return db('users').where({ open_id }).first();
}

export async function createUser(user) {
  return db('users').insert(user);
}

export async function updateUserInfo(open_id, { nickname, avatar }) {
  const update = {};
  if (nickname !== undefined) update.nickname = nickname;
  if (avatar !== undefined) update.avatar = avatar;
  if (Object.keys(update).length === 0) return;
  return db('users').where({ open_id }).update(update);
}

export async function findUsersByOpenIds(openIds) {
  if (!openIds || openIds.length === 0) return [];
  return db('users').whereIn('open_id', openIds).select('open_id', 'nickname', 'avatar');
} 