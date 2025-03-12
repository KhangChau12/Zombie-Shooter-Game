const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware để bảo vệ các route cần đăng nhập
const protect = async (req, res, next) => {
  let token;

  // Kiểm tra header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token từ header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm user từ id trong token và gán vào req.user
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Không được phép truy cập, token không hợp lệ' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Không được phép truy cập, không có token' });
  }
};

module.exports = { protect };