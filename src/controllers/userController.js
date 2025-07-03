import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { findByOpenId, createUser, updateUserInfo } from '../models/user.js';

const JWT_SECRET = process.env.JWT_SECRET || 'muyu_secret';
const WECHAT_APPID = process.env.WECHAT_APPID || '';
const WECHAT_SECRET = process.env.WECHAT_SECRET || '';

async function getOpenIdFromWeixin(code) {
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.openid) {
    console.error('微信接口返回:', data);
    throw new Error('获取 openid 失败: ' + JSON.stringify(data));
  }
  return data.openid;
}

export async function login(req, res) {
  const { code, nickname, avatar } = req.body;
  if (!code) return res.json({ code: 400, data: null, message: '缺少 code' });
  let open_id;
  try {
    open_id = await getOpenIdFromWeixin(code);
  } catch (e) {
    return res.json({ code: 400, data: null, message: 'code 无效或微信服务异常' });
  }
  let user = await findByOpenId(open_id);
  if (!user) {
    user = { open_id, nickname: nickname || '', avatar: avatar || '', role: 'user' };
    await createUser(user);
  } else {
    // 可选：更新昵称/头像
    await updateUserInfo(open_id, { nickname, avatar });
    user = await findByOpenId(open_id);
  }
  const token = jwt.sign({ open_id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ code: 0, data: { token, userInfo: user }, message: 'success' });
}

export async function getMe(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  const user = await findByOpenId(open_id);
  if (!user) return res.json({ code: 404, data: null, message: '用户不存在' });
  res.json({ code: 0, data: user, message: 'success' });
} 