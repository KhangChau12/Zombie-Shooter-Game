const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config();

// Khởi tạo Express
const app = express();

// Kết nối database
connectDB();

// Middleware
app.use(cors({
  origin: 'https://zombie-apocalypse-frontend.onrender.com',
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Tăng giới hạn kích thước JSON body

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/saves', require('./routes/saves'));

// Serve static files trong production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'index.html'));
  });
}

// Port và chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server đang chạy trên port ${PORT}`));