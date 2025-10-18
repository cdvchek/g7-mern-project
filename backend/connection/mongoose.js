const mongoose = require('mongoose');

const connectMongoose = async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/myapp';
    mongoose.set('strictQuery', true);

    await mongoose.connect(mongoUri, {});
    console.log("Connected to MongoDB");
}

module.exports = connectMongoose;