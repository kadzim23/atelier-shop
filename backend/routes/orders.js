const express = require('express');
const router = express.Router();
const { getDb } = require('../db/init');
const { requireAdmin } = require('../middleware/auth');

function generateOrderNumber() {
  const ymd = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ATL-${ymd}-${rand}`;
}

// PUBLIC: create order (checkout)
router.post('/', (req, res) => {
  const { customer_name, customer_email, customer_address, customer_phone, payment_method, items } = req.body;
  if (!customer_name || !customer_email || !customer_address || !items || !items.length)
    return res.status(400).json({ error: 'Data pemesanan tidak lengkap.' });

  const db = getDb();
  try {
    // Validate & compute totals
    let subtotal = 0;
    const validated = [];
    for (const item of items) {
      const product = db.get('SELECT * FROM products WHERE id = ?', item.product_id);
      if (!product) throw new Error(`Produk id ${item.product_id} tidak ditemukan.`);
      if (product.stock < item.quantity) throw new Error(`Stok "${product.name}" tidak cukup. Sisa: ${product.stock}.`);
      subtotal += product.price * item.quantity;
      validated.push({ ...item, price: product.price, product_name: product.name });
    }

    const shipping_fee = subtotal >= 500000 ? 0 : 25000;
    const total = subtotal + shipping_fee;
    const order_number = generateOrderNumber();

    // Insert order
    const orderResult = db.run(
      `INSERT INTO orders (order_number,customer_name,customer_email,customer_address,customer_phone,payment_method,subtotal,shipping_fee,total,status)
       VALUES (?,?,?,?,?,?,?,?,?,'paid')`,
      order_number, customer_name, customer_email, customer_address,
      customer_phone || '', payment_method || 'transfer', subtotal, shipping_fee, total
    );
    const orderId = orderResult.lastInsertRowid;

    // Insert items & deduct stock
    for (const item of validated) {
      db.run(
        'INSERT INTO order_items (order_id,product_id,product_name,size,price,quantity) VALUES (?,?,?,?,?,?)',
        orderId, item.product_id, item.product_name, item.size || '-', item.price, item.quantity
      );
      db.run('UPDATE products SET stock = stock - ? WHERE id = ?', item.quantity, item.product_id);
    }

    res.status(201).json({ success: true, order_number, subtotal, shipping_fee, total });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUBLIC: track order
router.get('/track/:orderNumber', (req, res) => {
  const db = getDb();
  const order = db.get('SELECT * FROM orders WHERE order_number = ?', req.params.orderNumber);
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  const items = db.all('SELECT * FROM order_items WHERE order_id = ?', order.id);
  res.json({ ...order, items });
});

// ADMIN: all orders
router.get('/', requireAdmin, (req, res) => {
  const db = getDb();
  res.json(db.all('SELECT * FROM orders ORDER BY created_at DESC'));
});

// ADMIN: order detail
router.get('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const order = db.get('SELECT * FROM orders WHERE id = ?', req.params.id);
  if (!order) return res.status(404).json({ error: 'Pesanan tidak ditemukan.' });
  const items = db.all('SELECT * FROM order_items WHERE order_id = ?', order.id);
  res.json({ ...order, items });
});

// ADMIN: update status
router.patch('/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  const valid = ['paid','processing','shipped','completed','cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Status tidak valid.' });
  const db = getDb();
  db.run('UPDATE orders SET status = ? WHERE id = ?', status, req.params.id);
  res.json({ success: true });
});

module.exports = router;
