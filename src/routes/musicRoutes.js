import express from 'express';
import { getMusicList, getMyMusic, exchangeMusic } from '../controllers/musicController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.get('/list', getMusicList);
router.get('/my', getMyMusic);
router.post('/exchange', exchangeMusic);

export default router; 