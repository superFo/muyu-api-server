import request from 'supertest';
import app from '../src/app.js';

describe('统计模块', () => {
  it('GET /stats 应返回统计数据', async () => {
    const res = await request(app)
      .get('/stats')
      .set('Authorization', 'Bearer mock-jwt');
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('userCount');
  });
}); 