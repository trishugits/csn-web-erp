const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({
    target: String,
    otp: String,
    createdAt: {type: Date, default: Date.now},
    expiresAt: Date,
    used: {type: Boolean, default: false}
});

module.exports = mongoose.model("OTP", otpSchema);