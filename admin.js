const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db').db;
const { isAdmin } = require('../middleware/auth');

// Konfigurasi upload gambar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Middleware admin untuk semua route di sini
router.use(isAdmin);

// Dashboard
router.get('/dashboard', (req, res) => {
  // Ambil count produk dan user
  db.get(`SELECT COUNT(*) as productCount FROM products`, (err, prodCount) => {
    db.get(`SELECT COUNT(*) as userCount FROM users WHERE role = 'user'`, (err, userCount) => {
      res.render('admin/dashboard', {
        productCount: prodCount ? prodCount.productCount : 0,
        userCount: userCount ? userCount.userCount : 0,
        user: req.session.user
      });
    });
  });
});

// ========== MANAJEMEN PRODUK ==========
router.get('/products', (req, res) => {
  db.all(`SELECT * FROM products ORDER BY created_at DESC`, (err, products) => {
    if (err) return res.status(500).send('Error');
    res.render('admin/products', { products, user: req.session.user });
  });
});

// Form tambah produk
router.get('/products/add', (req, res) => {
  res.render('admin/product-form', { product: null, user: req.session.user });
});

// Proses tambah produk
router.post('/products', upload.single('image'), (req, res) => {
  const { name, description, price } = req.body;
  const image_url = req.file ? '/uploads/' + req.file.filename : null;
  db.run(
    `INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)`,
    [name, description, price, image_url],
    function(err) {
      if (err) return res.status(500).send('Gagal tambah produk');
      res.redirect('/admin/products');
    }
  );
});

// Form edit produk
router.get('/products/edit/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM products WHERE id = ?`, [id], (err, product) => {
    if (err || !product) return res.status(404).send('Produk tidak ditemukan');
    res.render('admin/product-form', { product, user: req.session.user });
  });
});

// Proses update produk
router.put('/products/:id', upload.single('image'), (req, res) => {
  const id = req.params.id;
  const { name, description, price } = req.body;
  let image_url = null;
  if (req.file) {
    image_url = '/uploads/' + req.file.filename;
    // Hapus gambar lama jika ada
    db.get(`SELECT image_url FROM products WHERE id = ?`, [id], (err, row) => {
      if (row && row.image_url) {
        const oldPath = path.join(__dirname, '../public', row.image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    });
  }
  const query = image_url
    ? `UPDATE products SET name = ?, description = ?, price = ?, image_url = ? WHERE id = ?`
    : `UPDATE products SET name = ?, description = ?, price = ? WHERE id = ?`;
  const params = image_url
    ? [name, description, price, image_url, id]
    : [name, description, price, id];
  db.run(query, params, function(err) {
    if (err) return res.status(500).send('Gagal update');
    res.redirect('/admin/products');
  });
});

// Hapus produk
router.delete('/products/:id', (req, res) => {
  const id = req.params.id;
  // Hapus gambar
  db.get(`SELECT image_url FROM products WHERE id = ?`, [id], (err, row) => {
    if (row && row.image_url) {
      const oldPath = path.join(__dirname, '../public', row.image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    db.run(`DELETE FROM products WHERE id = ?`, [id], function(err) {
      if (err) return res.status(500).send('Gagal hapus');
      res.redirect('/admin/products');
    });
  });
});

// ========== MANAJEMEN USER ==========
router.get('/users', (req, res) => {
  db.all(`SELECT id, username, role, created_at FROM users`, (err, users) => {
    if (err) return res.status(500).send('Error');
    res.render('admin/users', { users, user: req.session.user });
  });
});

// Hapus user (tidak boleh hapus admin sendiri)
router.delete('/users/:id', (req, res) => {
  const id = req.params.id;
  if (id == req.session.user.id) {
    return res.status(400).send('Tidak bisa menghapus akun sendiri');
  }
  db.run(`DELETE FROM users WHERE id = ? AND role = 'user'`, [id], function(err) {
    if (err) return res.status(500).send('Gagal hapus');
    res.redirect('/admin/users');
  });
});

// ========== PENGATURAN TOKO (QR CODE) ==========
router.get('/settings', (req, res) => {
  db.get(`SELECT * FROM settings WHERE id = 1`, (err, settings) => {
    if (err) return res.status(500).send('Error');
    res.render('admin/settings', { settings, user: req.session.user });
  });
});

router.put('/settings', upload.single('qr_image'), (req, res) => {
  const { store_name } = req.body;
  let qr_image = null;
  if (req.file) {
    qr_image = '/uploads/' + req.file.filename;
    // Hapus QR lama
    db.get(`SELECT qr_image FROM settings WHERE id = 1`, (err, row) => {
      if (row && row.qr_image) {
        const oldPath = path.join(__dirname, '../public', row.qr_image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    });
  }
  const query = qr_image
    ? `UPDATE settings SET store_name = ?, qr_image = ? WHERE id = 1`
    : `UPDATE settings SET store_name = ? WHERE id = 1`;
  const params = qr_image ? [store_name, qr_image] : [store_name];
  db.run(query, params, function(err) {
    if (err) return res.status(500).send('Gagal update');
    res.redirect('/admin/settings');
  });
});

module.exports = router;