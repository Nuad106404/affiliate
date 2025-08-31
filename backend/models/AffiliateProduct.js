const mongoose = require('mongoose');

const affiliateProductSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  commissionRate: {
    type: Number,
    default: 15, // 15% commission rate
    min: 0,
    max: 100
  },
  totalEarnings: {
    type: Number,
    default: 0
  },
  totalClicks: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create unique compound index to prevent duplicate affiliate products
affiliateProductSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Generate referral code before saving
affiliateProductSchema.pre('save', function(next) {
  if (!this.referralCode) {
    // Generate a unique referral code
    const userPart = this.userId.toString().slice(-6);
    const productPart = this.productId.toString().slice(-6);
    const timePart = Date.now().toString().slice(-6);
    this.referralCode = `${userPart}-${productPart}-${timePart}`;
  }
  next();
});

// Virtual for commission amount based on product price
affiliateProductSchema.virtual('commissionAmount').get(function() {
  if (this.productId && this.productId.price) {
    const price = this.productId.discountedAmount || this.productId.price;
    return (price * this.commissionRate) / 100;
  }
  return 0;
});

// Ensure virtual fields are serialized
affiliateProductSchema.set('toJSON', { virtuals: true });
affiliateProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AffiliateProduct', affiliateProductSchema);
