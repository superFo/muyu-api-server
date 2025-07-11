import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'muyu_secret_new_2024';

export default function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, data: null, message: '未登录' });
  }
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ code: 401, data: null, message: '无效token' });
  }
} 