require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env')});

const mongoose = require('mongoose');
const connectDB = async () => {
    await mongoose.connect(process.env.DB_URI);
};

module.exports = connectDB;