const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GameHistory = require('../models/GameHistory');
const Match = require('../models/Match');
const { auth } = require('../middleware/auth');

// ============================================
// GET USER BALANCE
// ============================================

router.get('/balance', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      balance: user.balance,
      totalDeposits: user.totalDeposits,
      totalWinnings: user.totalWinnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance',
      error: error.message
    });
  }
});

// ============================================
// GET AVAILABLE GAMES
// ============================================

router.get('/games', auth, async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {
      status: { $in: ['upcoming', 'live'] },
      isActive: true
    };

    if (category) filter.category = category;

    const matches = await Match.find(filter)
      .sort({ matchDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Match.countDocuments(filter);

    res.status(200).json({
      success: true,
      matches,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch games',
      error: error.message
    });
  }
});

// ============================================
// PLACE BET
// ============================================

router.post('/place-bet', auth, async (req, res) => {
  try {
    const { matchId, betAmount, selectedTeam } = req.body;

    // Validation
    if (!matchId || !betAmount || !selectedTeam) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check balance
    if (user.balance < betAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Check bet limits
    if (betAmount < match.minBet || betAmount > match.maxBet) {
      return res.status(400).json({
        success: false,
        message: `Bet must be between ${match.minBet} and ${match.maxBet}`
      });
    }

    // Determine odds
    let selectedOdds = 0;
    if (selectedTeam === 'team1') selectedOdds = match.odds1;
    else if (selectedTeam === 'team2') selectedOdds = match.odds2;
    else if (selectedTeam === 'draw') selectedOdds = match.oddsDraw;

    // Create game history entry
    const gameHistory = new GameHistory({
      userId: req.userId,
      matchId,
      betAmount,
      selectedOdds,
      selectedTeam,
      matchStatus: match.status,
      matchResult: match.result
    });

    await gameHistory.save();

    // Deduct balance
    await user.deductBalance(betAmount);

    res.status(201).json({
      success: true,
      message: 'Bet placed successfully',
      bet: gameHistory,
      newBalance: user.balance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to place bet',
      error: error.message
    });
  }
});

// ============================================
// GET GAME HISTORY
// ============================================

router.get('/game-history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const gameHistory = await GameHistory.find({ userId: req.userId })
      .populate('matchId', 'title team1 team2 result status')
      .sort({ placedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await GameHistory.countDocuments({ userId: req.userId });

    res.status(200).json({
      success: true,
      games: gameHistory,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game history',
      error: error.message
    });
  }
});

// ============================================
// GET USER STATISTICS
// ============================================

router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const totalBets = await GameHistory.countDocuments({ userId: req.userId });
    const wonBets = await GameHistory.countDocuments({ userId: req.userId, result: 'won' });
    const lostBets = await GameHistory.countDocuments({ userId: req.userId, result: 'lost' });
    const totalStaked = await GameHistory.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: null, total: { $sum: '$betAmount' } } }
    ]);
    const totalWinnings = await GameHistory.aggregate([
      { $match: { userId: req.userId, result: 'won' } },
      { $group: { _id: null, total: { $sum: '$winAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        balance: user.balance,
        totalDeposits: user.totalDeposits,
        totalBets,
        wonBets,
        lostBets,
        totalStaked: totalStaked[0]?.total || 0,
        totalWinnings: totalWinnings[0]?.total || 0,
        winRate: totalBets > 0 ? ((wonBets / totalBets) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router;
