import express from 'express';
import { getStats } from '../controllers/statsController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.get('/', auth, getStats);

export default router; 