// server/config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

try {
  await mongoose.connect(uri, { dbName: 'nexabill' });
  console.log('✅ MongoDB connected');
} catch (err) {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
}
