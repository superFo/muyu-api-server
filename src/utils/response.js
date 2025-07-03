export function success(res, data, message = 'success') {
  res.json({ code: 0, data, message });
}

export function error(res, code, message = 'error') {
  res.json({ code, data: null, message });
} 