const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function fixUserLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load both User and Admin models
    const User = require('../models/User');
    
    // First check if user exists
    console.log('Searching for user with phone: 0805253934');
    const user = await User.findOne({ phone: "0805253934" });
    
    if (!user) {
      console.log('❌ User not found in User collection');
      
      // Check if user exists in Admin collection
      const Admin = require('../models/Admin');
      const admin = await Admin.findOne({ phone: "0805253934" });
      
      if (!admin) {
        console.log('❌ User not found in Admin collection either');
        process.exit(1);
      } else {
        console.log('✅ Found in Admin collection');
        console.log('Admin details:');
        console.log('- ID:', admin._id);
        console.log('- Name:', admin.name);
        console.log('- Phone:', admin.phone);
        console.log('- Role:', admin.role);
        console.log('- Status:', admin.status);
        
        // Reset admin password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("123123", salt);
        admin.password = hashedPassword;
        await admin.save();
        console.log('✅ Admin password reset to "123123"');
      }
    } else {
      console.log('✅ User found in User collection');
      console.log('User details:');
      console.log('- ID:', user._id);
      console.log('- Name:', user.name);
      console.log('- Phone:', user.phone);
      console.log('- Role:', user.role);
      console.log('- Status:', user.status);
      
      // Reset user password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("123123", salt);
      user.password = hashedPassword;
      await user.save();
      console.log('✅ User password reset to "123123"');
      
      // Test user login
      console.log('\n🔍 Testing user login with password "123123"...');
      const isMatch = await bcrypt.compare("123123", user.password);
      console.log('Password match result:', isMatch ? '✅ Success' : '❌ Failed');
    }
    
    console.log('\nAll operations completed.');
    mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixUserLogin();
