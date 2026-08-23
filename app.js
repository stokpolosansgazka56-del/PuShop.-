const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
  secret: 'rahasia-toko-single',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 hari
}));

// Buat folder uploads jika belum ada
const fs = require('fs');
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Inisialisasi database & seeding admin
db.init();

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const checkoutRoutes = require('./routes/checkout');

app.use('/', authRoutes);
app.use('/', productRoutes);
app.use('/admin', adminRoutes);
app.use('/checkout', checkoutRoutes);

// Home redirect ke daftar produk
app.get('/', (req, res) => res.redirect('/products'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});