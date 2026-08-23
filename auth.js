const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db').db;

// Halaman register
router.get('/register', (req, res) => {
  res.render('auth/register', { error: null });
});

// Proses register
router.post('/register', async (req, res) => {
  const { username, password, confirm } = req.body;
  if (password !== confirm) {
    return res.render('auth/register', { error: 'Password dan konfirmasi tidak cocok' });
  }
  if (password.length < 6) {
    return res.render('auth/register', { error: 'Password minimal 6 karakter' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (username, password) VALUES (?, ?)`,
      [username, hash],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.render('auth/register', { error: 'Username sudah digunakan' });
          }
          return res.render('auth/register', { error: 'Terjadi kesalahan' });
        }
        res.redirect('/login');
      }
    );
  } catch (e) {
    res.render('auth/register', { error: 'Terjadi kesalahan server' });
  }
});

// Halaman login
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

// Proses login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
    if (err || !user) {
      return res.render('auth/login', { error: 'Username atau password salah' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('auth/login', { error: 'Username atau password salah' });
    }
    req.session.user = { id: user.id, username: user.username, role: user.role };
    if (user.role === 'admin') {
      res.redirect('/admin/dashboard');
    } else {
      res.redirect('/products');
    }
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;