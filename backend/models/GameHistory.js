const mongoose = require('mongoose');

const gameHistorySchema = new mongoose.Schema({
  // User Info
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },

  // Match Info
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match ID is required']
  },

  // Bet Details
  betAmount: {
    type: Number,
    required: [true, 'Bet amount is required'],
    min: [1, 'Bet amount must be at least 1']
  },
  selectedOdds: {
    type: Number,
    required: [true, 'Selected odds is required']
  },
  selectedTeam: {
    type: String,
    enum: ['team1', 'team2', 'draw'],
    required: [true, 'Selected team is required']
  },

  // Result
  result: {
    type: String,
    enum: ['won', 'lost', 'pending', 'cancelled'],
    default: 'pending'
  },
  winAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  profit: {
    type: Number,
    default: 0
  },

  // Match Status at time of bet
  matchStatus: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'cancelled', 'postponed'],
    default: 'upcoming'
  },
  matchResult: {
    type: String,
    enum: ['team1', 'team2', 'draw', null],
    default: null
  },

  // Timestamps
  placedAt: {
    type: Date,
    default: Date.now
  },
  settledAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// ============================================
// INDEXES
// ============================================

gameHistorySchema.index({ userId: 1 });
gameHistorySchema.index({ matchId: 1 });
gameHistorySchema.index({ result: 1 });
gameHistorySchema.index({ placedAt: -1 });

// ============================================
// METHODS
// ============================================

/**
 * Settle bet based on match result
 * @param {String} matchResult - Match result (team1, team2, or draw)
 */
gameHistorySchema.methods.settle = async function(matchResult) {
  this.matchResult = matchResult;

  if (this.selectedTeam === matchResult) {
    this.result = 'won';
    this.winAmount = this.betAmount * this.selectedOdds;
    this.profit = this.winAmount - this.betAmount;

    // Add winnings to user balance
    const User = require('./User');
    const user = await User.findById(this.userId);
    if (user) {
      user.balance += this.winAmount;
      user.totalWinnings += this.profit;
      await user.save();
    }
  } else {
    this.result = 'lost';
    this.winAmount = 0;
    this.profit = -this.betAmount;
  }

  this.settledAt = new Date();
  return await this.save();
};

module.exports = mongoose.model('GameHistory', gameHistorySchema);
