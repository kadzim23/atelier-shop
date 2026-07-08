const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/init');
const { JWT_SECRET } = require('../middleware/auth');

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });

  const db = getDb();
  const admin = db.get('SELECT * FROM admins WHERE username = ?', username);
  if (!admin) return res.status(401).json({ error: 'Username atau password salah.' });

  const valid = bcrypt.compareSync(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: 'Username atau password salah.' });

  const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, username: admin.username });
});

module.exports = router;
