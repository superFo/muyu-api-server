import request from 'supertest';
import app from '../src/app.js';

describe('用户模块', () => {
  it('POST /users/login 应返回 token', async () => {
    const res = await request(app).post('/users/login').send({ code: 'mock' });
    expect(res.body.code).toBe(0);
    expect(res.body.data.token).toBeDefined();
  });

  it('GET /users/me 应返回用户信息', async () => {
    const res = await request(app).get('/users/me').set('Authorization', 'Bearer mock-jwt');
    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveProperty('open_id');
  });
}); 