const mongoose = require('mongoose');
const AuditLog = require('../models/AuditLog');
require('dotenv').config();

/**
 * Script to verify audit logs are being stored and not deleted
 * Creates test logs and monitors their persistence
 */
async function verifyAuditLogs() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check current audit log count
    const initialCount = await AuditLog.countDocuments();
    console.log(`📊 Current audit logs count: ${initialCount}`);
    
    // Create a test audit log
    console.log('🧪 Creating test audit log...');
    const testLog = await AuditLog.createLog({
      userId: new mongoose.Types.ObjectId(),
      userModel: 'User',
      userName: 'Test User',
      userRole: 'client',
      action: 'TEST',
      resource: 'Verification',
      details: `Test audit log created at ${new Date().toISOString()} to verify persistence`,
      ipAddress: '127.0.0.1',
      userAgent: 'Verification Script',
      severity: 'low',
      status: 'success',
      sessionId: 'test-session'
    });
    
    console.log('✅ Test audit log created:', testLog._id);
    
    // Verify the log exists
    const createdLog = await AuditLog.findById(testLog._id);
    if (createdLog) {
      console.log('✅ Test log verified in database');
      console.log(`📅 Created at: ${createdLog.createdAt}`);
    } else {
      console.log('❌ Test log not found in database');
    }
    
    // Check for any TTL indexes
    const db = mongoose.connection.db;
    const collection = db.collection('auditlogs');
    const indexes = await collection.indexes();
    
    console.log('\n📋 Current indexes:');
    let hasTTL = false;
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key);
      if (index.expireAfterSeconds !== undefined) {
        console.log(`   ⚠️  TTL Index detected! Expires after ${index.expireAfterSeconds} seconds`);
        hasTTL = true;
      }
    });
    
    if (!hasTTL) {
      console.log('✅ No TTL indexes found - logs will persist permanently');
    }
    
    // Get recent logs to show they exist
    const recentLogs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('action resource details createdAt');
    
    console.log('\n📝 Recent audit logs:');
    recentLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log.action} - ${log.resource} (${log.createdAt})`);
    });
    
    const finalCount = await AuditLog.countDocuments();
    console.log(`\n📊 Final audit logs count: ${finalCount}`);
    console.log(`📈 Logs added during verification: ${finalCount - initialCount}`);
    
    console.log('\n🎉 Audit log verification completed!');
    console.log('📝 If logs are still disappearing, check:');
    console.log('   1. MongoDB server TTL background task');
    console.log('   2. External cleanup scripts');
    console.log('   3. Database replication/backup processes');
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run verification
verifyAuditLogs();
