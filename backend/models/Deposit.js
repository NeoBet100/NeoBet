const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
  // User Info
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },

  // Deposit Details
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [100, 'Minimum deposit is 100']
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'INR']
  },

  // Payment Info
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'wallet'],
    required: [true, 'Payment method is required']
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  referenceNumber: {
    type: String,
    default: null
  },

  // Status & Approval
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  description: {
    type: String,
    trim: true
  },

  // Admin Actions
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
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

depositSchema.index({ userId: 1 });
depositSchema.index({ status: 1 });
depositSchema.index({ createdAt: -1 });
depositSchema.index({ transactionId: 1 });

// ============================================
// METHODS
// ============================================

/**
 * Approve deposit and add balance to user
 * @param {ObjectId} adminId - Admin user ID
 */
depositSchema.methods.approve = async function(adminId) {
  this.status = 'approved';
  this.approvedBy = adminId;
  this.approvedAt = new Date();
  await this.save();

  // Update user balance
  const User = require('./User');
  const user = await User.findById(this.userId);
  if (user) {
    await user.addBalance(this.amount);
  }

  return this;
};

/**
 * Reject deposit
 * @param {String} reason - Rejection reason
 */
depositSchema.methods.reject = async function(reason = null) {
  this.status = 'rejected';
  this.rejectionReason = reason || 'No reason provided';
  return await this.save();
};

module.exports = mongoose.model('Deposit', depositSchema);
