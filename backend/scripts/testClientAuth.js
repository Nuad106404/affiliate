const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { logLogin, logLogout } = require('../middleware/auditLogger');
require('dotenv').config();

/**
 * Script to test client authentication audit logging
 */
async function testClientAuth() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check initial audit log count
    const initialCount = await AuditLog.countDocuments();
    console.log(`📊 Initial audit logs count: ${initialCount}`);
    
    // Create a test client user
    console.log('👤 Creating test client user...');
    const testUser = new User({
      name: 'Test Client',
      phone: '0999999999',
      password: 'testpass123',
      role: 'client',
      status: 'active'
    });
    
    // Mock request object
    const mockReq = {
      ip: '127.0.0.1',
      get: (header) => header === 'User-Agent' ? 'Test Script' : null,
      sessionID: 'test-session-123',
      headers: {}
    };
    
    console.log('🧪 Testing client login audit logging...');
    
    // Test successful login
    await logLogin(testUser, mockReq, true);
    console.log('✅ Client successful login logged');
    
    // Test failed login
    await logLogin(testUser, mockReq, false);
    console.log('✅ Client failed login logged');
    
    // Test logout
    await logLogout(testUser, mockReq);
    console.log('✅ Client logout logged');
    
    // Check final count
    const finalCount = await AuditLog.countDocuments();
    console.log(`📊 Final audit logs count: ${finalCount}`);
    console.log(`📈 New logs created: ${finalCount - initialCount}`);
    
    // Show recent logs
    const recentLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action resource details userRole userName createdAt');
    
    console.log('\n📝 Recent audit logs:');
    recentLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log.action} - ${log.resource} - ${log.userRole} - ${log.userName} (${log.createdAt})`);
      console.log(`   Details: ${log.details}`);
    });
    
    console.log('\n🎉 Client authentication audit logging test completed!');
    
  } catch (error) {
    console.error('❌ Error during client auth test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run test
testClientAuth();
