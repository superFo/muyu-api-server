import express from 'express';
import { login, getMe, updateUserInfo } from '../controllers/userController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/update', auth, updateUserInfo);

export default router; 