const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discountedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Category and Tags
  category: {
    type: String,
    required: true,
    enum: ['Education', 'Tools', 'Design', 'Software', 'Marketing', 'Business', 'Health', 'Other']
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Media
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  
  // Inventory
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock', 'discontinued'],
    default: 'active'
  },
  
  // Affiliate Settings
  commissionRate: {
    type: Number,
    default: 10,
    min: 0,
    max: 50
  },
  allowAffiliate: {
    type: Boolean,
    default: true
  },
  
  // Analytics and Performance
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  soldCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Vendor Information
  vendor: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // SEO
  slug: {
    type: String,
    unique: true
  },
  metaTitle: String,
  metaDescription: String,
  
  // Statistics
  likes: {
    type: Number,
    default: 0
  },
  sales: {
    type: Number,
    default: 0
  },
  
  // Specifications
  specifications: [{
    name: String,
    value: String
  }],
  
  // Shipping
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  shippingClass: {
    type: String,
    enum: ['standard', 'express', 'overnight'],
    default: 'standard'
  }
}, {
  timestamps: true
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ sales: -1 });
productSchema.index({ createdAt: -1 });

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual for discounted price
productSchema.virtual('discountedPrice').get(function() {
  if (this.discountedAmount > 0) {
    return this.discountedAmount;
  } else if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  return this.price;
});

// Virtual for calculated discount percentage
productSchema.virtual('calculatedDiscount').get(function() {
  if (this.discountedAmount > 0 && this.price > 0 && this.discountedAmount < this.price) {
    return Math.round(((this.price - this.discountedAmount) / this.price) * 100 * 10) / 10;
  }
  return this.discount || 0;
});

// Pre-save middleware to auto-calculate discount percentage from amount
productSchema.pre('save', function(next) {
  // Always recalculate discount when discountedAmount or price changes
  if ((this.isModified('discountedAmount') || this.isModified('price')) && this.discountedAmount > 0 && this.price > 0 && this.discountedAmount < this.price) {
    this.discount = Math.round(((this.price - this.discountedAmount) / this.price) * 100 * 10) / 10;
  } else if (this.isModified('discount') && this.discount > 0 && this.price > 0) {
    this.discountedAmount = Math.round((this.price * (1 - this.discount / 100)) * 100) / 100;
  } else if ((this.isModified('discountedAmount') || this.isModified('price')) && (this.discountedAmount <= 0 || this.discountedAmount >= this.price)) {
    this.discount = 0;
  }
  next();
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary ? primary.url : (this.images[0] ? this.images[0].url : null);
});

// Method to update rating
productSchema.methods.updateRating = function(newRating) {
  const totalRating = (this.rating.average * this.rating.count) + newRating;
  this.rating.count += 1;
  this.rating.average = totalRating / this.rating.count;
  return this.save();
};

// Method to increment views
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
