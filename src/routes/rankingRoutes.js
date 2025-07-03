import express from 'express';
import { getRankings } from '../controllers/rankingController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get('/', auth, getRankings);

export default router; 