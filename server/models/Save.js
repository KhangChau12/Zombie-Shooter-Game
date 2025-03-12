const mongoose = require('mongoose');

const SaveSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slot: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  name: {
    type: String,
    default: 'Game Save'
  },
  screenshot: {
    type: String, // Base64 encoded small screenshot
    default: ''
  },
  stats: {
    level: Number,
    kills: Number,
    coins: Number,
    explored: Number,
    territories: Number
  },
  gameState: {
    player: Object,
    zombies: Array,
    mapSections: Array,
    pickups: Array,
    bullets: Array,
    effects: Array,
    evolutionLevel: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can only have one save per slot
SaveSchema.index({ user: 1, slot: 1 }, { unique: true });

module.exports = mongoose.model('Save', SaveSchema);