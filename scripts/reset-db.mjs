import mongoose from 'mongoose';
import fs from 'fs';

let mongoUri = 'mongodb://127.0.0.1:27017/face_attendance_db';

try {
  const envFile = fs.readFileSync('.env', 'utf8');
  const match = envFile.match(/MONGO_URI=(.*)/);
  if (match && match[1]) {
    mongoUri = match[1].trim();
  }
} catch (e) {
  // Ignore missing .env
}

async function reset() {
  await mongoose.connect(mongoUri, { family: 4, tlsAllowInvalidCertificates: true });
  console.log("✅ Connected to MongoDB.");

  const db = mongoose.connection.db;

  try {
    await db.dropDatabase();
    console.log("✅ Dropped the entire database.");

    const usersCollection = db.collection('users');
    
    await usersCollection.insertOne({
      name: "Owner",
      email: "kuldeepmaurya4296@gmail.com",
      role: "Owner",
      password: "123456",
      status: "Active",
      createdAt: new Date()
    });

    console.log("✅ Fresh Owner user inserted (kuldeepmaurya4296@gmail.com).");
  } catch (err) {
    console.error("❌ Error resetting database:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected.");
    process.exit(0);
  }
}

reset();
