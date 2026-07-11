import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const resetInitialization = async () => {
  await connectDB();
  console.log('Connected to DB');
  const res = await User.updateMany({}, { $set: { 'streak.isInitialized': false } });
  console.log('Update result:', res);
  process.exit();
};

resetInitialization();
