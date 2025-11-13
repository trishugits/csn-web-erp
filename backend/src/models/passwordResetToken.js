const mongoose = require('mongoose');
const passwordResetToken = new mongoose.Schema({
    target: {type: String, required: true},
    token: {type: String, required: true},
    expiresAt: {type: Date, required:true},
});
module.exports = mongoose.model('PasswordResetToken', passwordResetToken);