// src/lib/mongodb.js
import mongoose from 'mongoose';

// const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_URI = 'mongodb+srv://keshwanitejas:oKYUV8jazcBhheJh@cluster0.uzciewx.mongodb.net/NexDev?retryWrites=true&w=majority&appName=Cluster0'
console.log("MONGODB_URI:", MONGODB_URI); // Add this line
// const hehe = process.env.HELLO;
// console.log(hehe);
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("Connected to MongoDB");
      return mongoose;
    }).catch((err) => {
      console.error("MongoDB connection error:", err);
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
