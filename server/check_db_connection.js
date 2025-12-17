import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/word-imposter";

console.log(`Testing connection to: ${uri}`);

mongoose.connect(uri)
    .then(() => {
        console.log("SUCCESS: MongoDB is Connected!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("FAILURE: MongoDB Connection Error:", err.message);
        process.exit(1);
    });
