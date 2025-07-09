import db from '../config/db.js';

export async function getUserMusic(open_id) {
  return db('user_music').where({ open_id }).select();
}

export async function addUserMusic(open_id, music_id) {
  return db('user_music').insert({ open_id, music_id });
}

export async function findUserMusic(open_id, music_id) {
  return db('user_music').where({ open_id, music_id }).first();
} 