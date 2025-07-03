export default function (err, req, res, next) {
  res.status(500).json({ code: -1, data: null, message: err.message || '服务器错误' });
} 