import express from 'express';
import { createRecord, getRecords } from '../controllers/recordController.js';
import { batchCreateRecords } from '../controllers/recordController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/', auth, createRecord);
router.get('/', auth, getRecords);
router.post('/batch', auth, batchCreateRecords);

export default router; 