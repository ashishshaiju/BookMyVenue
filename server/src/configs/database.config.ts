import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<typeof mongoose> => {
  const mongodburi = process.env.MONGODB_URI;

  if (!mongodburi) {
    console.error('MONGODB_URI environment variable is not set');
    process.exit(1);
  }

  try {
    const connection = await mongoose.connect(mongodburi, {
      autoIndex: process.env.NODE_ENV !== 'production',
    });
    console.log('Connected to MongoDB');
    return connection;
  } catch (error) {
    console.error('Failed to connect to MongoDB', { error: (error as Error).message });
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Failed to disconnect from MongoDB', { error: (error as Error).message });
    process.exit(1);
  }
};
