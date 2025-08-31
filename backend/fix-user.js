const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Define User schema
    const userSchema = new mongoose.Schema({
      name: String,
      phone: String,
      password: String,
      role: String,
      status: String
    });
    
    // Create User model directly
    const User = mongoose.model('User', userSchema);
    
    // Find user with phone 0805253934
    const user = await User.findOne({ phone: "0805253934" });
    
    if (!user) {
      console.log('❌ User not found!');
      return;
    }
    
    console.log('✅ User found:', user.name);
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("123123", salt);
    
    // Update user password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password reset successfully for', user.name);
    console.log('- ID:', user._id);
    console.log('- Phone:', user.phone);
    console.log('- Role:', user.role);
    console.log('- Status:', user.status);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

main();
