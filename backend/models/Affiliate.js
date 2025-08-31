const mongoose = require('mongoose');

const affiliateSchema = new mongoose.Schema({
  // Affiliate User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Product Association
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // Commission Settings
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 50
  },
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  fixedCommission: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  
  // Performance Metrics
  totalSales: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  totalClicks: {
    type: Number,
    default: 0
  },
  totalConversions: {
    type: Number,
    default: 0
  },
  
  // Approval Information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  
  // Application Details
  applicationNotes: String,
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'expert'],
    default: 'beginner'
  },
  marketingChannels: [{
    type: String,
    enum: ['social_media', 'email', 'blog', 'youtube', 'paid_ads', 'other']
  }],
  
  // Tracking
  uniqueCode: {
    type: String,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
affiliateSchema.index({ user: 1, product: 1 }, { unique: true });
affiliateSchema.index({ status: 1 });
affiliateSchema.index({ totalSales: -1 });

// Pre-save middleware to generate unique code
affiliateSchema.pre('save', function(next) {
  if (this.isNew && !this.uniqueCode) {
    this.uniqueCode = `AFF${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  next();
});

// Method to calculate conversion rate
affiliateSchema.virtual('conversionRate').get(function() {
  if (this.totalClicks === 0) return 0;
  return (this.totalConversions / this.totalClicks) * 100;
});

// Method to update performance
affiliateSchema.methods.updatePerformance = function(saleAmount, commission) {
  this.totalSales += saleAmount;
  this.totalCommission += commission;
  this.totalConversions += 1;
  return this.save();
};

module.exports = mongoose.model('Affiliate', affiliateSchema);
