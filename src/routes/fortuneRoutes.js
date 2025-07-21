const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const fortuneController = require('../controllers/fortuneController');

// 获取今日运势
router.get('/today', auth, fortuneController.today);

// AI占卜提问
router.post('/ask', auth, fortuneController.ask);

module.exports = router; 