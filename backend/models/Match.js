const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // Match Details
  title: {
    type: String,
    required: [true, 'Match title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['football', 'basketball', 'tennis', 'esports', 'cricket', 'other'],
    default: 'football'
  },

  // Teams/Competitors
  team1: {
    type: String,
    required: [true, 'Team 1 is required'],
    trim: true
  },
  team2: {
    type: String,
    required: [true, 'Team 2 is required'],
    trim: true
  },
  team1Logo: String,
  team2Logo: String,

  // Odds
  odds1: {
    type: Number,
    required: [true, 'Odds for team 1 is required'],
    min: [1.0, 'Odds must be at least 1.0']
  },
  odds2: {
    type: Number,
    required: [true, 'Odds for team 2 is required'],
    min: [1.0, 'Odds must be at least 1.0']
  },
  oddsDraw: {
    type: Number,
    default: 0,
    min: 0
  },

  // Match Details
  matchDate: {
    type: Date,
    required: [true, 'Match date is required']
  },
  venue: String,
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled', 'postponed'],
    default: 'upcoming'
  },
  result: {
    type: String,
    enum: ['team1', 'team2', 'draw', null],
    default: null
  },
  score: {
    team1Score: { type: Number, default: 0 },
    team2Score: { type: Number, default: 0 }
  },

  // Betting Limits
  minBet: {
    type: Number,
    default: 100,
    min: [1, 'Minimum bet must be at least 1']
  },
  maxBet: {
    type: Number,
    default: 100000,
    min: [1, 'Maximum bet must be at least 1']
  },

  // Active Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Creator Info
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// ============================================
// INDEXES
// ============================================

matchSchema.index({ matchDate: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ category: 1 });
matchSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Match', matchSchema);
