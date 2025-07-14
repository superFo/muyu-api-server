process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import express from 'express';
import rateLimit from 'express-rate-limit';
import userRoutes from './routes/userRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import rankingRoutes from './routes/rankingRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import musicRoutes from './routes/musicRoutes.js';

const app = express();
app.use(express.json());

// 登录接口限流（按IP）
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1分钟
  max: 5,
  message: { code: 429, message: '操作过于频繁，请稍后再试' }
});
// 敲击接口限流（按用户）
const recordLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: req => req.user?.open_id || req.ip,
  message: { code: 429, message: '敲击过快，请稍后再试' }
});
// 其他接口限流（按用户）
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: req => req.user?.open_id || req.ip,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
});

// 登录接口限流
app.use('/users/login', loginLimiter);
// 敲击接口限流
app.use('/records', recordLimiter);
// 其他接口限流（兜底）
app.use(generalLimiter);

app.use('/users', userRoutes);
app.use('/records', recordRoutes);
app.use('/rankings', rankingRoutes);
app.use('/stats', statsRoutes);
app.use('/music', musicRoutes);

app.get('/', (req, res) => {
  res.json({ code: 0, data: 'ok', message: 'API running' });
});

// TODO: 挂载路由

export default app;

// 仅在非测试环境下启动服务
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
} 