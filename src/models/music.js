import db from '../config/db.js';

export async function getAllMusic() {
  return db('music').select();
}

export async function getMusicById(id) {
  return db('music').where({ id }).first();
}

export async function createMusic(music) {
  return db('music').insert(music);
} 