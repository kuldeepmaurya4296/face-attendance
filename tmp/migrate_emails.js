
const mongoose = require('mongoose');
// Hardcoded from .env to ensure connection success
const MONGO_URI = "mongodb://kuldeepmaurya4296_db_user:kDXIYA9LReVDcyFh@ac-ibjs9tq-shard-00-00.h5jgrpx.mongodb.net:27017,ac-ibjs9tq-shard-00-01.h5jgrpx.mongodb.net:27017,ac-ibjs9tq-shard-00-02.h5jgrpx.mongodb.net:27017/face_attendance_db?ssl=true&authSource=admin&retryWrites=true";

async function migrate() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const users = await db.collection('users').find().toArray();
    
    let count = 0;
    for (const user of users) {
      if (!user.email) continue;
      
      const normalizedEmail = user.email.toLowerCase().trim();
      if (user.email !== normalizedEmail) {
        console.log(`Normalizing: ${user.email} -> ${normalizedEmail}`);
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { email: normalizedEmail } }
        );
        count++;
      }
    }
    
    console.log(`Successfully normalized ${count} user emails.`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
