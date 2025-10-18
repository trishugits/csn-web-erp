const mongoose = require('mongoose');
const connectDB = async () => {
    await mongoose.connect("mongodb+srv://csn_db_user:Chandravali%402025@cluster0.fzfrlt1.mongodb.net/schoolDB?retryWrites=true&w=majority&appName=Cluster0");
};

module.exports = connectDB;