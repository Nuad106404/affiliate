const mongoose = require('mongoose');
require('dotenv').config();

/**
 * Script to drop existing TTL indexes from AuditLog collection
 * This ensures that any previously created TTL indexes are completely removed
 */
async function dropTTLIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('auditlogs');
    
    console.log('📋 Checking existing indexes...');
    const indexes = await collection.indexes();
    
    console.log('Current indexes:');
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key);
      if (index.expireAfterSeconds) {
        console.log(`   ⚠️  TTL Index found! Expires after ${index.expireAfterSeconds} seconds`);
      }
    });
    
    // Find and drop TTL indexes
    let droppedCount = 0;
    for (const index of indexes) {
      if (index.expireAfterSeconds !== undefined) {
        console.log(`🗑️  Dropping TTL index: ${index.name}`);
        try {
          await collection.dropIndex(index.name);
          console.log(`✅ Successfully dropped TTL index: ${index.name}`);
          droppedCount++;
        } catch (error) {
          console.error(`❌ Failed to drop index ${index.name}:`, error.message);
        }
      }
    }
    
    if (droppedCount === 0) {
      console.log('✅ No TTL indexes found - audit logs will be kept permanently');
    } else {
      console.log(`✅ Dropped ${droppedCount} TTL index(es) - audit logs will now be kept permanently`);
    }
    
    // Verify indexes after dropping
    console.log('\n📋 Final index state:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${index.name}:`, index.key);
      if (index.expireAfterSeconds) {
        console.log(`   ⚠️  WARNING: TTL Index still exists! Expires after ${index.expireAfterSeconds} seconds`);
      }
    });
    
    console.log('\n🎉 TTL index cleanup completed successfully!');
    console.log('📝 Audit logs will now be stored permanently until manually deleted');
    
  } catch (error) {
    console.error('❌ Error dropping TTL indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
dropTTLIndexes();
