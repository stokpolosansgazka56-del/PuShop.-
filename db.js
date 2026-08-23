const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'toko.db');
const db = new sqlite3.Database(dbPath);

function init() {
  db.serialize(() => {
    // Tabel users
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabel products
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabel settings (hanya 1 baris untuk QR code dan nama toko)
    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        store_name TEXT DEFAULT 'Toko Saya',
        qr_image TEXT
      )
    `);
    // Insert default settings jika belum ada
    db.get(`SELECT id FROM settings WHERE id = 1`, (err, row) => {
      if (!row) {
        db.run(`INSERT INTO settings (id, store_name) VALUES (1, 'Toko Saya')`);
      }
    });

    // Buat admin default jika belum ada
    const adminUsername = 'Putzx';
    const adminPassword = 'putzxxxxx';
    db.get(`SELECT id FROM users WHERE username = ?`, [adminUsername], (err, row) => {
      if (!row) {
        bcrypt.hash(adminPassword, 10, (err, hash) => {
          if (!err) {
            db.run(
              `INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')`,
              [adminUsername, hash]
            );
            console.log('Admin default dibuat: Putzx / putzxxxxx');
          }
        });
      }
    });
  });
}

function getDB() { return db; }

module.exports = { init, getDB, db };