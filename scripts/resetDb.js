const mongoose = require('mongoose');

async function resetDb() {
  const uri = "mongodb://kuldeepmaurya4296_db_user:kDXIYA9LReVDcyFh@ac-ibjs9tq-shard-00-00.h5jgrpx.mongodb.net:27017,ac-ibjs9tq-shard-00-01.h5jgrpx.mongodb.net:27017,ac-ibjs9tq-shard-00-02.h5jgrpx.mongodb.net:27017/face_attendance_db?ssl=true&authSource=admin&retryWrites=true";
  
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB successfully.\n');

    const collections = await mongoose.connection.db.collections();
    
    for (const collection of collections) {
      if (collection.collectionName === 'users') {
        const res = await collection.deleteMany({ role: { $ne: 'Owner' } });
        console.log(`[Users] Deleted ${res.deletedCount} non-Owner users.`);
      } else if (collection.collectionName !== 'system.indexes' && !collection.collectionName.startsWith('system.')) {
        const res = await collection.deleteMany({});
        console.log(`[${collection.collectionName}] Cleared ${res.deletedCount} documents.`);
      }
    }

    console.log('\nDatabase reset complete. Only Owner users remain.');
  } catch (error) {
    console.error('Error resetting DB:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

resetDb();
