import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { findByOpenId, createUser, updateUserInfo as updateUserInfoModel } from '../models/user.js';

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
  const mode = process.env.LOGIN_MODE || 'cloudbase'; // 默认云托管免鉴权
  let open_id;
  let logTag = '[WeixinLogin][自动化][强制日志]';

  console.log(`${logTag} 当前登录模式:`, mode);

  if (mode === 'cloudbase') {
    // 微信云托管免鉴权模式
    open_id = req.headers['x-wx-openid'];
    logTag += '[免鉴权]';
    console.log(`${logTag} 从请求头获取 openid:`, open_id);
    if (!open_id) {
      console.error(`${logTag} 未获取到 openid`);
      return res.json({ code: 401, data: null, message: '未获取到 openid，请确认已在微信云托管环境下调用' });
    }
  } else {
    // 传统 code2Session 模式
    const { code } = req.body;
    logTag += '[code2Session]';
    console.log(`${logTag} 收到 code:`, code);
    if (!code) {
      console.error(`${logTag} 缺少 code`);
      return res.json({ code: 400, data: null, message: '缺少 code' });
    }
    try {
      open_id = await getOpenIdFromWeixin(code);
      console.log(`${logTag} 获取 openid 成功:`, open_id);
    } catch (e) {
      console.error(`${logTag} code2Session 失败:`, e && e.message);
      return res.json({ code: 400, data: null, message: 'code 无效或微信服务异常' });
    }
  }

  const { nickname, avatar } = req.body;
  console.log(`${logTag} /users/login 入参:`, { open_id, nickname, avatar });

  let user = await findByOpenId(open_id);
  if (!user) {
    user = { open_id, nickname: nickname || '', avatar: avatar || '', role: 'user' };
    await createUser(user);
    console.log(`${logTag} 新建用户:`, user);
  } else {
    await updateUserInfoModel(open_id, { nickname, avatar });
    user = await findByOpenId(open_id);
    console.log(`${logTag} 已有用户，更新后:`, user);
  }
  // 保证nickname和avatar有值
  user.nickname = user.nickname && user.nickname.trim() ? user.nickname : '木鱼用户';
  user.avatar = user.avatar && user.avatar.trim() ? user.avatar : '/assets/default-avatar.png';
  const token = jwt.sign({ open_id }, JWT_SECRET, { expiresIn: '7d' });
  console.log(`${logTag} 签发 token 成功:`, token ? 'yes' : 'no');
  res.json({ code: 0, data: { token, userInfo: user }, message: 'success' });
}
// ... existing code ...

export async function updateUserInfo(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  let { avatar, nickname } = req.body;
  // 自动转换 fileID 为 HTTPS 公网链接
  const COS_DOMAIN = 'https://7072-prod-2gxlvind87f18af8-1366437278.tcb.qcloud.la';
  if (avatar && avatar.startsWith('cloud://')) {
    avatar = COS_DOMAIN + avatar.replace(/^cloud:\/\/[^/]+/, '');
  }
  await updateUserInfoModel(open_id, { avatar, nickname });
  res.json({ code: 0, data: null, message: '更新成功' });
}

export async function getMe(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  const user = await findByOpenId(open_id);
  if (!user) return res.json({ code: 404, data: null, message: '用户不存在' });
  // 保证nickname和avatar有值
  user.nickname = user.nickname && user.nickname.trim() ? user.nickname : '木鱼用户';
  user.avatar = user.avatar && user.avatar.trim() ? user.avatar : '/assets/default-avatar.png';
  res.json({ code: 0, data: user, message: 'success' });
}

export async function queryByCode(req, res) {
  const { code } = req.body;
  if (!code) return res.json({ code: 400, data: null, message: '缺少 code' });
  let open_id;
  try {
    open_id = await getOpenIdFromWeixin(code);
  } catch (e) {
    return res.json({ code: 400, data: null, message: 'code 无效' });
  }
  const user = await findByOpenId(open_id);
  if (user) {
    // 保证nickname和avatar有值
    user.nickname = user.nickname && user.nickname.trim() ? user.nickname : '木鱼用户';
    user.avatar = user.avatar && user.avatar.trim() ? user.avatar : '/assets/default-avatar.png';
    res.json({ code: 0, data: user, message: 'success' });
  } else {
    res.json({ code: 0, data: null, message: 'not found' });
  }
} 