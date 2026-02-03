const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://pipipahmy_db_user:2PlYsWRYZnx2pqEN@cluster0.pnb4cnu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Successfully connected to MongoDB!');
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Whitelist IP 0.0.0.0/0 in MongoDB Atlas Network Access');
    console.error('2. Check if database user exists and password is correct');
    console.error('3. Wait 1-2 minutes after whitelisting IP');
    process.exit(1);
  }
}

testConnection();
