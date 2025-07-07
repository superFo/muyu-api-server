import express from 'express';
import { login, getMe, updateUserInfo, queryByCode } from '../controllers/userController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/update', auth, updateUserInfo);
router.post('/queryByCode', queryByCode);

export default router; 