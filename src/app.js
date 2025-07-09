process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import express from 'express';
import userRoutes from './routes/userRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import rankingRoutes from './routes/rankingRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import musicRoutes from './routes/musicRoutes.js';

const app = express();
app.use(express.json());

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