import db from '../config/db.js';

export async function getAllMusic() {
  return db('music').select('id', 'name', 'url', 'required_hits', 'is_default');
}

export async function getMusicById(id) {
  return db('music').where({ id }).first();
}

export async function createMusic(music) {
  // music: { name, url, required_hits, is_default }
  return db('music').insert(music);
}

export async function updateMusic(id, data) {
  return db('music').where({ id }).update(data);
}

export async function deleteMusic(id) {
  return db('music').where({ id }).del();
} 