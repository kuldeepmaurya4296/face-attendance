const mongoose = require('mongoose');

const MONGO_URI = "mongodb://kuldeepmaurya4296_db_user:kDXIYA9LReVDcyFh@ac-ibjs9tq-shard-00-01.h5jgrpx.mongodb.net:27017/face_attendance_db?ssl=true&authSource=admin&directConnection=true";

async function checkData() {
  try {
    await mongoose.connect(MONGO_URI, { family: 4, tlsAllowInvalidCertificates: true });
    
    // Check users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Users count:', users.length);
    console.log('Users roles:', users.map(u => u.role));

    // Check attendance for today
    const today = new Date();
    today.setHours(0,0,0,0);
    const attendances = await mongoose.connection.db.collection('attendances').find({ date: today }).toArray();
    console.log('Attendances today:', attendances.length);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkData();
