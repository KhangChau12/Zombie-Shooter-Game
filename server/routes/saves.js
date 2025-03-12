const express = require('express');
const router = express.Router();
const { saveGame, getSaves, getSaveBySlot, deleteSave } = require('../controllers/saves');
const { protect } = require('../middleware/auth');

// Tất cả các route đều cần đăng nhập
router.use(protect);

router.route('/')
  .post(saveGame)   // Lưu game
  .get(getSaves);   // Lấy tất cả bản lưu

router.route('/:slot')
  .get(getSaveBySlot)    // Lấy bản lưu theo slot
  .delete(deleteSave);   // Xóa bản lưu

module.exports = router;