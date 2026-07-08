const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { requireAdmin } = require('../middleware/auth');

// PUBLIC: get all products
router.get('/', (req, res) => {
  const { category, search } = req.query;
  const db = getDb();
  let query = 'SELECT * FROM products';
  const conditions = [];
  const params = [];

  if (category && category !== 'all') {
    conditions.push('category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('(name LIKE ? OR description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY created_at DESC';

  res.json(db.all(query, ...params));
});

// PUBLIC: get single product
router.get('/:id', (req, res) => {
  const db = getDb();
  const product = db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  res.json(product);
});

// ADMIN: create product
router.post('/', requireAdmin, (req, res) => {
  const { sku, name, description, price, category, image_url, stock, sizes } = req.body;
  if (!name || price === undefined)
    return res.status(400).json({ error: 'Nama dan harga produk wajib diisi.' });

  const db = getDb();
  try {
    const result = db.run(
      `INSERT INTO products (sku,name,description,price,category,image_url,stock,sizes,updated_at)
       VALUES (?,?,?,?,?,?,?,?,datetime('now'))`,
      sku || null, name, description || '', price,
      category || 'Lainnya', image_url || '', stock || 0, sizes || ''
    );
    const newProduct = db.get('SELECT * FROM products WHERE id = ?', result.lastInsertRowid);
    res.status(201).json(newProduct);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE'))
      return res.status(400).json({ error: 'SKU sudah digunakan produk lain.' });
    res.status(500).json({ error: 'Gagal menambah produk.' });
  }
});

// ADMIN: update product
router.put('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const existing = db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan.' });

  const { sku, name, description, price, category, image_url, stock, sizes } = req.body;
  try {
    db.run(
      `UPDATE products SET sku=?,name=?,description=?,price=?,category=?,
       image_url=?,stock=?,sizes=?,updated_at=datetime('now') WHERE id=?`,
      sku ?? existing.sku,
      name ?? existing.name,
      description ?? existing.description,
      price ?? existing.price,
      category ?? existing.category,
      image_url ?? existing.image_url,
      stock ?? existing.stock,
      sizes ?? existing.sizes,
      req.params.id
    );
    res.json(db.get('SELECT * FROM products WHERE id = ?', req.params.id));
  } catch (err) {
    res.status(500).json({ error: 'Gagal memperbarui produk.' });
  }
});

// ADMIN: delete product
router.delete('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const existing = db.get('SELECT * FROM products WHERE id = ?', req.params.id);
  if (!existing) return res.status(404).json({ error: 'Produk tidak ditemukan.' });
  db.run('DELETE FROM products WHERE id = ?', req.params.id);
  res.json({ success: true, message: 'Produk berhasil dihapus.' });
});

module.exports = router;
