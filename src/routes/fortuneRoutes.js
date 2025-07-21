import express from 'express';
import auth from '../middlewares/auth.js';
import { today, ask } from '../controllers/fortuneController.js';

const router = express.Router();
router.get('/today', auth, today);
router.post('/ask', auth, ask);

export default router; 