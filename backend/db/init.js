const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'store.db');

let _sqlJs = null;
let _rawDb = null;

function saveDb() {
  const data = _rawDb.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function makeWrapper() {
  return {
    all(sql, ...params) {
      const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const stmt = _rawDb.prepare(sql);
      if (flat.length) stmt.bind(flat);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    },

    get(sql, ...params) {
      const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const stmt = _rawDb.prepare(sql);
      if (flat.length) stmt.bind(flat);
      let row = undefined;
      if (stmt.step()) row = stmt.getAsObject();
      stmt.free();
      return row;
    },

    run(sql, ...params) {
      const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      _rawDb.run(sql, flat.length ? flat : undefined);
      const idRow = _rawDb.exec('SELECT last_insert_rowid() as id');
      const lastInsertRowid = idRow.length ? idRow[0].values[0][0] : null;
      saveDb();
      return { lastInsertRowid };
    },

    prepare(sql) {
      const self = this;
      return {
        run(...params) { return self.run(sql, ...params); },
        all(...params) { return self.all(sql, ...params); },
        get(...params) { return self.get(sql, ...params); }
      };
    }
  };
}

async function initDb() {
  _sqlJs = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    _rawDb = new _sqlJs.Database(buf);
  } else {
    _rawDb = new _sqlJs.Database();
  }

  const db = makeWrapper();

  // Schema
  _rawDb.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT UNIQUE, name TEXT NOT NULL, description TEXT,
    price REAL NOT NULL, category TEXT, image_url TEXT,
    stock INTEGER DEFAULT 0, sizes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`);
  _rawDb.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL
  )`);
  _rawDb.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE, customer_name TEXT, customer_email TEXT,
    customer_address TEXT, customer_phone TEXT, payment_method TEXT,
    subtotal REAL, shipping_fee REAL, total REAL,
    status TEXT DEFAULT 'paid',
    created_at TEXT DEFAULT (datetime('now'))
  )`);
  _rawDb.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER, product_id INTEGER, product_name TEXT,
    size TEXT, price REAL, quantity INTEGER
  )`);
  saveDb();

  // Seed admin
  const adminRow = db.get('SELECT COUNT(*) as c FROM admins');
  if (!adminRow || adminRow.c === 0) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run('INSERT INTO admins (username, password_hash) VALUES (?, ?)', 'admin', hash);
    console.log('Default admin -> username: admin / password: admin123');
  }

  // Seed products
  const prodRow = db.get('SELECT COUNT(*) as c FROM products');
  if (!prodRow || prodRow.c === 0) {
    const sample = [
      ['ATL-0001','Wol Coat Charcoal','Coat wol premium dengan potongan oversized, lapisan dalam satin.',1250000,'Outerwear','https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800',12,'S,M,L,XL'],
      ['ATL-0002','Linen Shirt Ecru','Kemeja linen ringan, breathable, dijahit dengan kerah klasik.',425000,'Tops','https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800',25,'S,M,L,XL'],
      ['ATL-0003','Tailored Trouser Black','Celana tailored dengan potongan lurus, bahan stretch nyaman.',380000,'Bottoms','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',18,'S,M,L,XL'],
      ['ATL-0004','Knit Sweater Cream','Sweater rajut lembut dari katun premium, hangat tanpa berat.',320000,'Tops','https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800',20,'S,M,L'],
      ['ATL-0005','Denim Jacket Washed','Jaket denim klasik dengan washed finish, dirancang untuk dipakai bertahun-tahun.',450000,'Outerwear','https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=800',15,'S,M,L,XL'],
      ['ATL-0006','Silk Slip Dress','Dress slip dari silk dengan jatuhan kain yang halus, potongan midi.',690000,'Dresses','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',10,'XS,S,M,L'],
      ['ATL-0007','Leather Belt Tan','Belt kulit asli warna tan dengan buckle metal minimalis.',195000,'Accessories','https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800',30,'S,M,L'],
      ['ATL-0008','Cotton Tee Basic White','Kaos katun combed 30s, potongan reguler, dasar wardrobe.',145000,'Tops','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',50,'S,M,L,XL,XXL']
    ];
    for (const p of sample) {
      db.run('INSERT INTO products (sku,name,description,price,category,image_url,stock,sizes) VALUES (?,?,?,?,?,?,?,?)', ...p);
    }
    console.log('Sample products seeded.');
  }

  return db;
}

function getDb() {
  return makeWrapper();
}

module.exports = { initDb, getDb };
