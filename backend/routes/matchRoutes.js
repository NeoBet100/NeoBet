const express = require('express');
const router = express.Router();
const Match = require('../models/Match');
const { auth, adminAuth } = require('../middleware/auth');

// ============================================
// GET ALL MATCHES - Public route
// ============================================

router.get('/', async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { isActive: true };
    if (status) filter.status = status;
    if (category) filter.category = category;

    const matches = await Match.find(filter)
      .populate('createdBy', 'username')
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
      message: 'Failed to fetch matches',
      error: error.message
    });
  }
});

// ============================================
// GET MATCH BY ID - Public route
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id).populate('createdBy', 'username');

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match',
      error: error.message
    });
  }
});

// ============================================
// CREATE MATCH - Admin only
// ============================================

router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, team1, team2, odds1, odds2, oddsDraw, matchDate, category, minBet, maxBet, description } = req.body;

    // Validation
    if (!title || !team1 || !team2 || !odds1 || !odds2 || !matchDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const match = new Match({
      title,
      team1,
      team2,
      odds1,
      odds2,
      oddsDraw,
      matchDate,
      category,
      minBet,
      maxBet,
      description,
      createdBy: req.userId
    });

    await match.save();

    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create match',
      error: error.message
    });
  }
});

// ============================================
// UPDATE MATCH - Admin only
// ============================================

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Match updated successfully',
      match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update match',
      error: error.message
    });
  }
});

// ============================================
// DELETE MATCH - Admin only
// ============================================

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const match = await Match.findByIdAndDelete(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete match',
      error: error.message
    });
  }
});

module.exports = router;
