const mongoose = require("mongoose");
const noticeSchema = new mongoose.Schema({
    title: String,
    message: String,
    target: {
        roles: [String],
        classes: [String],
        ids: [String]
    },
    startDate: Date,
    endDate: Date,
    important: {type: Boolean, default: false},
    createdBy: {type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel'},
    createdByModel: String,
    createdAt: {type: Date, default: Date.now},
});

module.exports = mongoose.model('notice', noticeSchema);

