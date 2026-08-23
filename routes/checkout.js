const express = require('express');
const router = express.Router();
const db = require('../db').db;
const { isLoggedIn } = require('../middleware/auth');

router.get('/checkout/:productId', isLoggedIn, (req, res) => {
  const productId = req.params.productId;
  db.get(`SELECT * FROM products WHERE id = ?`, [productId], (err, product) => {
    if (err || !product) return res.status(404).send('Produk tidak ditemukan');
    db.get(`SELECT * FROM settings WHERE id = 1`, (err, settings) => {
      if (err) return res.status(500).send('Error');
      res.render('checkout', {
        product,
        settings,
        user: req.session.user
      });
    });
  });
});

module.exports = router;
