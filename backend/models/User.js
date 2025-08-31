const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  
  banMessage: {
    type: String,
    default: 'กรุณาติดต่อผู้ดูแลระบบ'
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500
  },
  website: {
    type: String
  },
  location: {
    type: String
  },
  
  // Address Information
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  // Banking Information (for affiliates)
  bankDetails: {
    accountNumber: String,
    bankName: String,
    accountOwnerName: String
  },
  
  // Credits and Financial
  credits: {
    type: Number,
    default: 0
  },
  accountBalance: {
    type: Number,
    default: 0
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  todayEarnings: {
    type: Number,
    default: 0
  },
  weekEarnings: {
    type: Number,
    default: 0
  },
  totalPurchases: {
    type: Number,
    default: 0
  },
  
  // Engagement Metrics
  engagementMetrics: {
    visitors: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    followers: {
      type: Number,
      default: 0
    }
  },
  
  // User Role
  role: {
    type: String,
    enum: ['user', 'client', 'admin', 'superadmin'],
    default: 'user'
  },
  
  // Referral System
  referralCode: {
    type: String,
    index: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  
  lastLogin: {
    type: Date
  },
}, {
  timestamps: true
});

// Indexes
userSchema.index({ role: 1, status: 1 });

// No password hashing - store as plain text

// Method to compare password (plain text)
userSchema.methods.comparePassword = async function(candidatePassword) {
  return candidatePassword === this.password;
};

// Method to generate referral code (6-digit unique number)
userSchema.methods.generateReferralCode = async function() {
  // Generate a unique 6-digit number
  let isUnique = false;
  let code;
  
  while (!isUnique) {
    // Generate a random 6-digit number
    code = Math.floor(100000 + Math.random() * 900000);
    // Check if this code already exists in the database
    const existingUser = await mongoose.model('User').findOne({ referralCode: code.toString() });
    
    if (!existingUser) {
      isUnique = true;
    }
  }
  
  this.referralCode = code.toString();
  return this.referralCode;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Transform output - keep password for admin access
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.emailVerificationToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);
