# ATELIER — Full Stack Fashion E-Commerce

Toko fashion personal built with **Node.js + Express + SQLite** (backend) dan **HTML/CSS/JS vanilla** (frontend).

---

## 🚀 Cara Menjalankan

### Kebutuhan
- **Node.js** versi 18 ke atas → https://nodejs.org

### Langkah Setup

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Install dependency
npm install

# 3. Jalankan server
npm start
```

Buka browser ke **http://localhost:3000**

---

## 🔑 Login Admin

URL: **http://localhost:3000/admin.html**

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

---

## ✨ Fitur

### Toko (Customer)
- Katalog produk dengan filter kategori
- Pencarian produk real-time
- **Keranjang belanja** (persist di browser)
- Detail produk + pilih ukuran + pilih jumlah
- **Checkout** dengan 3 metode pembayaran (Transfer, QRIS, COD)
- Validasi stok real-time saat checkout
- Ongkir otomatis (gratis untuk belanja ≥ Rp 500.000)
- **Lacak pesanan** by nomor order

### Admin Panel
- Login aman dengan JWT (token 8 jam)
- **Dashboard** — statistik produk, pesanan, revenue, stok habis
- **CRUD Produk** — tambah, edit, hapus produk lengkap dengan preview gambar
- **Manajemen Pesanan** — lihat semua pesanan, detail per pesanan, ubah status
- Search & filter produk dan pesanan
- Status pesanan: Dibayar → Diproses → Dikirim → Selesai / Dibatalkan

---

## 📁 Struktur Folder

```
atelier/
├── backend/
│   ├── db/
│   │   └── init.js          # Database schema + seed data
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── routes/
│   │   ├── auth.js          # POST /api/auth/login
│   │   ├── products.js      # CRUD /api/products
│   │   └── orders.js        # /api/orders
│   ├── server.js            # Entry point Express
│   └── package.json
├── frontend/
│   ├── css/
│   │   └── style.css        # Desain ATELIER brand
│   ├── js/
│   │   ├── api.js           # HTTP helper + formatRupiah
│   │   ├── cart.js          # Cart state (localStorage)
│   │   └── app.js           # App logic utama
│   ├── index.html           # Halaman toko
│   └── admin.html           # Admin panel
├── package.json
└── README.md
```

---

## 🛠️ API Endpoints

| Method | Path | Auth | Keterangan |
|--------|------|------|-----------|
| POST | `/api/auth/login` | — | Login admin |
| GET | `/api/products` | — | List produk (filter: `?category=Tops&search=coat`) |
| GET | `/api/products/:id` | — | Detail produk |
| POST | `/api/products` | Admin | Tambah produk |
| PUT | `/api/products/:id` | Admin | Update produk |
| DELETE | `/api/products/:id` | Admin | Hapus produk |
| POST | `/api/orders` | — | Buat pesanan (checkout) |
| GET | `/api/orders/track/:orderNumber` | — | Lacak pesanan |
| GET | `/api/orders` | Admin | Semua pesanan |
| GET | `/api/orders/:id` | Admin | Detail pesanan |
| PATCH | `/api/orders/:id/status` | Admin | Update status |

---

## 🔒 Keamanan

- Password admin di-hash dengan **bcrypt**
- JWT token dengan expiry 8 jam
- Harga dan stok divalidasi **di server** saat checkout (tidak bisa dimanipulasi dari browser)
- Semua route admin dilindungi middleware JWT

---

## 🎨 Desain

Brand **ATELIER** — fashion studio minimalis premium.
- Warna: Hitam pekat, Krem hangat, Gold muted, Cokelat tanah
- Font: Cormorant Garamond (display) + Inter (body)
- Responsive untuk mobile dan desktop
