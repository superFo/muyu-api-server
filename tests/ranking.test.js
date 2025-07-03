import request from 'supertest';
import app from '../src/app.js';

describe('排行榜模块', () => {
  it('GET /rankings 应返回排行榜', async () => {
    const res = await request(app)
      .get('/rankings')
      .set('Authorization', 'Bearer mock-jwt');
    expect(res.body.code).toBe(0);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
}); 