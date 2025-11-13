const mongoose = require('mongoose');

const feeStructureSchema = new mongoose.Schema({
    class: {type: String, required: true},
    session: {type: String, required: true},
    tuitionFee: { type: Number, required: true },
    transportFee: { type: Number, default: 0 },
    examFee: { type: Number, default: 0 },
    otherCharges: { type: Number, default: 0 },
    totalFee: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" },
}, {timestamps: true});

module.exports = mongoose.model("FeeStructure", feeStructureSchema);