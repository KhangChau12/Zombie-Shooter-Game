const Save = require('../models/Save');

// @desc   Lưu tiến trình game
// @route  POST /api/saves
// @access Private
exports.saveGame = async (req, res) => {
  try {
    const { slot, name, screenshot, stats, gameState } = req.body;
    
    // Validate slot number
    if (slot < 1 || slot > 3) {
      return res.status(400).json({ message: 'Số slot phải từ 1-3' });
    }

    // Check if save already exists for this user and slot
    const existingSave = await Save.findOne({ user: req.user._id, slot });

    if (existingSave) {
      // Update existing save
      existingSave.name = name || existingSave.name;
      existingSave.screenshot = screenshot || existingSave.screenshot;
      existingSave.stats = stats || existingSave.stats;
      existingSave.gameState = gameState || existingSave.gameState;
      existingSave.updatedAt = Date.now();

      await existingSave.save();
      
      return res.status(200).json({
        message: 'Game đã được lưu thành công',
        save: {
          id: existingSave._id,
          slot: existingSave.slot,
          name: existingSave.name,
          stats: existingSave.stats,
          updatedAt: existingSave.updatedAt
        }
      });
    }

    // Create new save
    const newSave = await Save.create({
      user: req.user._id,
      slot,
      name: name || `Game Save ${slot}`,
      screenshot: screenshot || '',
      stats,
      gameState,
    });

    res.status(201).json({
      message: 'Game đã được lưu thành công',
      save: {
        id: newSave._id,
        slot: newSave.slot,
        name: newSave.name,
        stats: newSave.stats,
        createdAt: newSave.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi lưu game' });
  }
};

// @desc   Lấy tất cả bản lưu của người dùng
// @route  GET /api/saves
// @access Private
exports.getSaves = async (req, res) => {
  try {
    const saves = await Save.find({ user: req.user._id })
      .select('slot name screenshot stats createdAt updatedAt')
      .sort({ slot: 1 });

    res.status(200).json(saves);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bản lưu' });
  }
};

// @desc   Lấy một bản lưu cụ thể
// @route  GET /api/saves/:slot
// @access Private
exports.getSaveBySlot = async (req, res) => {
  try {
    const slot = parseInt(req.params.slot);
    
    // Validate slot number
    if (slot < 1 || slot > 3 || isNaN(slot)) {
      return res.status(400).json({ message: 'Slot không hợp lệ' });
    }

    const save = await Save.findOne({ user: req.user._id, slot });

    if (!save) {
      return res.status(404).json({ message: 'Không tìm thấy bản lưu ở slot này' });
    }

    res.status(200).json(save);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi lấy bản lưu' });
  }
};

// @desc   Xóa một bản lưu
// @route  DELETE /api/saves/:slot
// @access Private
exports.deleteSave = async (req, res) => {
  try {
    const slot = parseInt(req.params.slot);
    
    // Validate slot number
    if (slot < 1 || slot > 3 || isNaN(slot)) {
      return res.status(400).json({ message: 'Slot không hợp lệ' });
    }

    const save = await Save.findOne({ user: req.user._id, slot });

    if (!save) {
      return res.status(404).json({ message: 'Không tìm thấy bản lưu ở slot này' });
    }

    await save.remove();

    res.status(200).json({ message: 'Bản lưu đã được xóa' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi xóa bản lưu' });
  }
};