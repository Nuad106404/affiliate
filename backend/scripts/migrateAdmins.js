const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
require('dotenv').config();

const migrateAdmins = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB for migration...');

    // Find all admin and superadmin users
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'superadmin'] } 
    });

    console.log(`📋 Found ${adminUsers.length} admin/superadmin users to migrate`);

    for (const user of adminUsers) {
      // Check if admin already exists in Admin collection
      const existingAdmin = await Admin.findOne({ phone: user.phone });
      
      if (existingAdmin) {
        console.log(`⏭️  Admin with phone ${user.phone} already exists in Admin collection`);
        continue;
      }

      // Create new admin in Admin collection
      const newAdmin = new Admin({
        name: user.name,
        phone: user.phone,
        password: user.password,
        role: user.role,
        status: user.status || 'active',
        avatar: user.avatar,
        bio: user.bio,
        permissions: user.permissions || [],
        lastLogin: user.lastLogin,
        isDefaultSuperAdmin: user.isDefaultSuperAdmin || false,
        email: user.email
      });

      await newAdmin.save();
      console.log(`✅ Migrated ${user.role} user: ${user.name} (${user.phone})`);

      // Remove from User collection
      await User.findByIdAndDelete(user._id);
      console.log(`🗑️  Removed ${user.name} from User collection`);
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

migrateAdmins();
