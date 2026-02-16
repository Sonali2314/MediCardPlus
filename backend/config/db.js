import mongoose from 'mongoose';
import '../models/doctorModel.js';
import '../models/patientModel.js';
import '../models/hospitalModel.js';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medicard');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log('Database models initialized successfully');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        console.error('Please make sure MongoDB is installed and running on your system');
        console.error('You can download MongoDB from: https://www.mongodb.com/try/download/community');
        process.exit(1);
    }
};

export default connectDB;