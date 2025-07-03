import express from 'express';
import { login, getMe } from '../controllers/userController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', auth, getMe);

export default router; 