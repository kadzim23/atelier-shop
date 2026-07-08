const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Boot: init DB first, then start server
initDb().then(() => {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/products', require('./routes/products'));
  app.use('/api/orders', require('./routes/orders'));

  app.use(express.static(path.join(__dirname, '../frontend')));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
  });

  app.listen(PORT, () => {
    console.log(`\n  ATELIER berjalan di http://localhost:${PORT}`);
    console.log(`  Admin: http://localhost:${PORT}/admin.html`);
    console.log(`  Login: admin / admin123\n`);
  });
}).catch(err => {
  console.error('Gagal init database:', err);
  process.exit(1);
});
