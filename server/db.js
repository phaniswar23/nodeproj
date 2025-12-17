import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // MIGRATION: Drop obsolete email index if it exists to prevent E11000 errors
        try {
            await mongoose.connection.collection('users').dropIndex('email_1');
            console.log('Obsolete email index dropped successfully');
        } catch (error) {
            // Index might not exist, which is fine
            if (error.code !== 27) { // 27 = IndexNotFound
                // console.log('Note: email index could not be dropped or does not exist', error.message);
            }
        }

    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
