import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("Please add MONGODB_URI to .env.local");

type Cached = { conn: Mongoose | null; promise: Promise<Mongoose> | null };

declare global {
  var mongoose: Cached | undefined;
}

// ใช้ const แทน let เพราะ cached จะไม่ถูก reassign
const cached: Cached = global.mongoose ?? { conn: null, promise: null };

export async function connectDB(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }

  cached.conn = await cached.promise;
  global.mongoose = cached;

  return cached.conn;
}
