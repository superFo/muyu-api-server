import express from 'express';
import { login, getMe, updateUserInfo, queryByCode, getUserSkinsController, setUserCurrentSkinController } from '../controllers/userController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/update', auth, updateUserInfo);
router.post('/queryByCode', queryByCode);
// 新增皮肤相关接口
router.get('/skins', auth, getUserSkinsController);
router.post('/skin', auth, setUserCurrentSkinController);

export default router; 