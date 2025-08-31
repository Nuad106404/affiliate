const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Role and Status
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
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
  
  // Admin Specific
  permissions: [{
    type: String
  }],
  lastLogin: {
    type: Date
  },
  isDefaultSuperAdmin: {
    type: Boolean,
    default: false
  },
  
  // Email (optional for admins)
  email: {
    type: String,
    required: false,
    sparse: true,
    lowercase: true,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
adminSchema.index({ role: 1, status: 1 });

// Method to compare password (plain text)
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return candidatePassword === this.password;
};

// Virtual for full name
adminSchema.virtual('fullName').get(function() {
  return this.name;
});

// Transform output
adminSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Admin', adminSchema);
