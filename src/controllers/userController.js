import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { findByOpenId, createUser, updateUserInfo as updateUserInfoModel } from '../models/user.js';
import { getUserSkins, getUserCurrentSkin, setUserCurrentSkin } from '../models/skin.js';

const JWT_SECRET = process.env.JWT_SECRET || 'muyu_secret_new_2024'; // 修改密钥强制重新登录
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
    open_id = req.headers['x-wx-openid'];
    logTag += '[免鉴权]';
    console.log(`${logTag} 从请求头获取 openid:`, open_id);
    if (!open_id) {
      console.error(`${logTag} 未获取到 openid`);
      return res.json({ code: 401, data: null, message: '未获取到 openid，请确认已在微信云托管环境下调用' });
    }
  } else {
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
    // 新用户必须自定义上传头像和昵称，否则不允许注册
    if (!nickname || !avatar || nickname === '微信用户') {
      return res.json({ code: 400, data: null, message: '请上传头像和昵称' });
    }
    user = { open_id, nickname, avatar, role: 'user' };
    await createUser(user);
    console.log(`${logTag} 新建用户:`, user);
  } else {
    // 只在数据库缺失昵称/头像时才用微信数据覆盖
    const updateData = {};
    if (!user.nickname || user.nickname === '微信用户') {
      if (nickname && nickname !== '微信用户') updateData.nickname = nickname;
    }
    if (!user.avatar) {
      if (avatar) updateData.avatar = avatar;
    }
    if (Object.keys(updateData).length > 0) {
      await updateUserInfoModel(open_id, updateData);
    }
    user = await findByOpenId(open_id);
    // 老用户如果nickname为“微信用户”，强制前端弹窗
    if (user.nickname === '微信用户') {
      return res.json({ code: 400, data: null, message: '请上传头像和昵称' });
    }
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

// 获取用户皮肤列表及当前皮肤
export async function getUserSkinsController(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  const skins = await getUserSkins(open_id);
  const currentSkinId = await getUserCurrentSkin(open_id);
  console.log('[用户皮肤] open_id:', open_id);
  console.log('[用户皮肤] 查询到的皮肤列表:', skins);
  console.log('[用户皮肤] 当前皮肤ID:', currentSkinId);
  res.json({ code: 0, data: { skins, currentSkinId }, message: 'success' });
}

// 设置当前皮肤
export async function setUserCurrentSkinController(req, res) {
  const open_id = req.user?.open_id;
  if (!open_id) return res.json({ code: 401, data: null, message: '未登录' });
  const { skin_id } = req.body;
  // 只在 undefined 或 null 时报错，允许 0 作为默认皮肤
  if (skin_id === undefined || skin_id === null) {
    return res.json({ code: 400, data: null, message: '缺少皮肤ID' });
  }
  await setUserCurrentSkin(open_id, skin_id);
  res.json({ code: 0, data: null, message: '皮肤已切换' });
} 