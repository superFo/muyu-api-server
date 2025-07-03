import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { findByOpenId, createUser, updateUserInfo } from '../models/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'muyu_secret';
const WECHAT_APPID = process.env.WECHAT_APPID || '';
const WECHAT_SECRET = process.env.WECHAT_SECRET || '';

async function getOpenIdFromWeixin(code) {
  // 日志：请求参数
  console.log('[WeixinLogin][强制日志] code2Session 请求参数:', {
    code,
    appid: WECHAT_APPID,
    secret: WECHAT_SECRET ? WECHAT_SECRET.slice(0, 4) + '***' + WECHAT_SECRET.slice(-4) : ''
  });
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`;
  let res, data;
  try {
    res = await fetch(url);
    data = await res.json();
    // 日志：微信接口原始响应
    console.log('[WeixinLogin][强制日志] code2Session 响应:', data);
  } catch (err) {
    console.error('[WeixinLogin][强制日志] code2Session 请求异常:', err);
    throw new Error('请求微信接口异常: ' + err.message);
  }
  if (!data.openid) {
    console.error('[WeixinLogin][强制日志] 获取 openid 失败:', data);
    throw new Error('获取 openid 失败: ' + JSON.stringify(data));
  }
  return data.openid;
}
// ... existing code ...
export async function login(req, res) {
  const { code, nickname, avatar } = req.body;
  // 日志：收到前端参数
  console.log('[WeixinLogin][强制日志] /users/login 入参:', { code, nickname, avatar });
  if (!code) {
    console.error('[WeixinLogin][强制日志] 缺少 code');
    return res.json({ code: 400, data: null, message: '缺少 code' });
  }
  let open_id;
  try {
    open_id = await getOpenIdFromWeixin(code);
    console.log('[WeixinLogin][强制日志] 获取 openid 成功:', open_id);
  } catch (e) {
    console.error('[WeixinLogin][强制日志] code2Session 失败:', e && e.message);
    return res.json({ code: 400, data: null, message: 'code 无效或微信服务异常' });
  }
  let user = await findByOpenId(open_id);
  if (!user) {
    user = { open_id, nickname: nickname || '', avatar: avatar || '', role: 'user' };
    await createUser(user);
    console.log('[WeixinLogin][强制日志] 新建用户:', user);
  } else {
    // 可选：更新昵称/头像
    await updateUserInfo(open_id, { nickname, avatar });
    user = await findByOpenId(open_id);
    console.log('[WeixinLogin][强制日志] 已有用户，更新后:', user);
  }
  const token = jwt.sign({ open_id }, JWT_SECRET, { expiresIn: '7d' });
  console.log('[WeixinLogin][强制日志] 签发 token 成功:', token ? 'yes' : 'no');
  res.json({ code: 0, data: { token, userInfo: user }, message: 'success' });
}



export async function getMe(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  const user = await findByOpenId(open_id);
  if (!user) return res.json({ code: 404, data: null, message: '用户不存在' });
  res.json({ code: 0, data: user, message: 'success' });
} 