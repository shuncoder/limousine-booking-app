const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');

    // Project safety: remove accidental unique index on phone (allows many null/missing)
    try {
      await mongoose.connection.collection('users').dropIndex('phone_1');
    } catch (e) {
      // ignore if index doesn't exist
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;