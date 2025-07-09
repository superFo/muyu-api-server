import Router from 'koa-router';
import { getMusicList, getMyMusic, exchangeMusic } from '../controllers/musicController.js';
import auth from '../middlewares/auth.js';

const router = new Router({ prefix: '/music' });

router.use(auth);

router.get('/list', getMusicList);
router.get('/my', getMyMusic);
router.post('/exchange', exchangeMusic);

export default router; 