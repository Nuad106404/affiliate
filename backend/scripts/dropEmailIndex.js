const mongoose = require('mongoose');
require('dotenv').config();

const dropEmailIndex = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB...');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Check existing indexes
    const indexes = await collection.indexes();
    console.log('📋 Current indexes:', indexes.map(idx => idx.name));

    // Drop email index if it exists
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Dropped email_1 index successfully');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  email_1 index does not exist');
      } else {
        console.error('❌ Error dropping email_1 index:', error.message);
      }
    }

    // List indexes after dropping
    const newIndexes = await collection.indexes();
    console.log('📋 Indexes after cleanup:', newIndexes.map(idx => idx.name));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

dropEmailIndex();
