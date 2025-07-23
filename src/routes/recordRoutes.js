import express from 'express';
import { createRecord, getRecords } from '../controllers/recordController.js';
import { batchCreateRecords } from '../controllers/recordController.js';
import auth from '../middlewares/auth.js';
import rateLimit from 'express-rate-limit';

// /records/batch 专属限流：1分钟15次
const batchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  keyGenerator: req => req.user?.open_id || req.ip,
  message: { code: 429, message: '批量上报过快，请稍后再试' }
});

const router = express.Router();

router.post('/', auth, createRecord);
router.get('/', auth, getRecords);
router.post('/batch', auth, batchLimiter, batchCreateRecords);

export default router; 