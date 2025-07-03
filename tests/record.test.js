import request from 'supertest';
import app from '../src/app.js';

describe('敲击记录模块', () => {
  it('POST /records 应成功', async () => {
    const res = await request(app)
      .post('/records')
      .set('Authorization', 'Bearer mock-jwt')
      .send({ timestamp: Date.now() });
    expect(res.body.code).toBe(0);
  });

  it('GET /records 应返回记录列表', async () => {
    const res = await request(app)
      .get('/records')
      .set('Authorization', 'Bearer mock-jwt');
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('list');
  });
}); 