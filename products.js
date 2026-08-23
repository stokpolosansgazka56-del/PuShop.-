const express = require('express');
const router = express.Router();
const db = require('../db').db;

// Daftar semua produk
router.get('/products', (req, res) => {
  db.all(`SELECT * FROM products ORDER BY created_at DESC`, (err, products) => {
    if (err) return res.status(500).send('Error database');
    res.render('index', { products, user: req.session.user });
  });
});

// Detail produk
router.get('/product/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM products WHERE id = ?`, [id], (err, product) => {
    if (err || !product) return res.status(404).send('Produk tidak ditemukan');
    res.render('product-detail', { product, user: req.session.user });
  });
});

module.exports = router;