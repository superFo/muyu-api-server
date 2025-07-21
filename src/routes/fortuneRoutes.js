import express from 'express';
import auth from '../middlewares/auth.js';
import { today, ask, askCount } from '../controllers/fortuneController.js';

const router = express.Router();
router.get('/today', auth, today);
router.post('/ask', auth, ask);
router.get('/ask/count', auth, askCount);

export default router; 