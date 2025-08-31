const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createDefaultSuperAdmin = async () => {
  try {
    // Check if default superadmin already exists
    let existingAdmin = await Admin.findOne({ phone: '0805253934' });
    
    if (existingAdmin) {
      // Update existing admin to be default superadmin
      existingAdmin.role = 'superadmin';
      existingAdmin.name = 'Default SuperAdmin';
      existingAdmin.isDefaultSuperAdmin = true;
      await existingAdmin.save();
      console.log('✅ Updated existing admin to Default SuperAdmin');
    } else {
      // Create new default superadmin
      const defaultSuperAdmin = new Admin({
        name: 'Default SuperAdmin',
        phone: '0805253934',
        password: '/*106404Rin',
        role: 'superadmin',
        status: 'active',
        isDefaultSuperAdmin: true
      });
      
      await defaultSuperAdmin.save();
      console.log('✅ Created Default SuperAdmin user');
    }
  } catch (error) {
    console.error('❌ Error creating default superadmin:', error);
  }
};

// Run if called directly
if (require.main === module) {
  createDefaultSuperAdmin();
}

module.exports = createDefaultSuperAdmin;
