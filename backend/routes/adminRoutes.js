const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Match = require('../models/Match');
const Deposit = require('../models/Deposit');
const GameHistory = require('../models/GameHistory');
const { adminAuth } = require('../middleware/auth');

// ============================================
// GET ADMIN STATISTICS
// ============================================

router.get('/statistics', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMatches = await Match.countDocuments();
    const totalDeposits = await Deposit.countDocuments();
    const totalBets = await GameHistory.countDocuments();
    const pendingDeposits = await Deposit.countDocuments({ status: 'pending' });
    const approvedDeposits = await Deposit.countDocuments({ status: 'approved' });

    const totalDepositAmount = await Deposit.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      statistics: {
        totalUsers,
        totalMatches,
        totalDeposits,
        totalBets,
        pendingDeposits,
        approvedDeposits,
        totalDepositAmount: totalDepositAmount[0]?.total || 0
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

// ============================================
// GET ALL USERS
// ============================================

router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// ============================================
// SUSPEND/UNSUSPEND USER
// ============================================

router.put('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

// ============================================
// SETTLE MATCH - Update match result and settle bets
// ============================================

router.post('/matches/:id/settle', adminAuth, async (req, res) => {
  try {
    const { result, score } = req.body;

    if (!['team1', 'team2', 'draw'].includes(result)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid result'
      });
    }

    // Update match
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      {
        result,
        status: 'completed',
        score: score || match.score
      },
      { new: true }
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Settle all pending bets for this match
    const pendingBets = await GameHistory.find({
      matchId: req.params.id,
      result: 'pending'
    });

    let settledCount = 0;
    for (let bet of pendingBets) {
      await bet.settle(result);
      settledCount++;
    }

    res.status(200).json({
      success: true,
      message: 'Match settled successfully',
      match,
      settledBets: settledCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to settle match',
      error: error.message
    });
  }
});

module.exports = router;
