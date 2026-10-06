import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/classic_cut_salon';
    console.log(`Connecting to MongoDB...`);
    
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log(`\n💡 If using MongoDB Atlas, check your connection string in server/.env`);
    console.log(`💡 If using MongoDB locally, make sure MongoDB Compass / mongod is running at mongodb://127.0.0.1:27017/classic_cut_salon\n`);
  }
};
