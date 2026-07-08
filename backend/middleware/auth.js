const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'atelier-dev-secret-change-in-production';

function requireAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Tidak ada token. Silakan login.' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

module.exports = { requireAdmin, JWT_SECRET };
