const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Get User model
    const User = require('../models/User');
    
    // Find user with phone 0805253934
    const user = await User.findOne({ phone: "0805253934" });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    // Hash the new password
    const password = "123123";
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully');
    console.log('User details:');
    console.log('- Name:', user.name);
    console.log('- Phone:', user.phone);
    console.log('- Role:', user.role);
    console.log('- Status:', user.status);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
