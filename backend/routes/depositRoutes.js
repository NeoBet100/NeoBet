const express = require('express');
const router = express.Router();
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

// ============================================
// REQUEST DEPOSIT - User deposits money
// ============================================

router.post('/request', auth, async (req, res) => {
  try {
    const { amount, paymentMethod, description } = req.body;

    // Validation
    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum deposit is 100'
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const deposit = new Deposit({
      userId: req.userId,
      amount,
      paymentMethod,
      description,
      transactionId
    });

    await deposit.save();

    res.status(201).json({
      success: true,
      message: 'Deposit request created successfully',
      deposit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create deposit request',
      error: error.message
    });
  }
});

// ============================================
// GET USER DEPOSITS - User views their deposits
// ============================================

router.get('/my-deposits', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const deposits = await Deposit.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Deposit.countDocuments({ userId: req.userId });

    res.status(200).json({
      success: true,
      deposits,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deposits',
      error: error.message
    });
  }
});

// ============================================
// GET ALL DEPOSITS - Admin views all deposits
// ============================================

router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;

    const deposits = await Deposit.find(filter)
      .populate('userId', 'username email')
      .populate('approvedBy', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Deposit.countDocuments(filter);

    res.status(200).json({
      success: true,
      deposits,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deposits',
      error: error.message
    });
  }
});

// ============================================
// APPROVE DEPOSIT - Admin approves deposit
// ============================================

router.post('/:id/approve', adminAuth, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve a ${deposit.status} deposit`
      });
    }

    // Approve deposit
    await deposit.approve(req.userId);

    res.status(200).json({
      success: true,
      message: 'Deposit approved successfully',
      deposit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve deposit',
      error: error.message
    });
  }
});

// ============================================
// REJECT DEPOSIT - Admin rejects deposit
// ============================================

router.post('/:id/reject', adminAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: 'Deposit not found'
      });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject a ${deposit.status} deposit`
      });
    }

    // Reject deposit
    await deposit.reject(reason);

    res.status(200).json({
      success: true,
      message: 'Deposit rejected',
      deposit
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject deposit',
      error: error.message
    });
  }
});

module.exports = router;
