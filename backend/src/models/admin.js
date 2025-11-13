const mongoose = require("mongoose");
const adminSchema = new mongoose.Schema({
    adminId: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    email: {type: String, sparse: true, unique: true},
    password: {type: String, required: true},
    roles: [String],
    aadharId: String,
}, {timestamps: true});

module.exports = mongoose.model('Admin', adminSchema);