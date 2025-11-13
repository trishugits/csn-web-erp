const mongoose = require("mongoose");
const teacherSchema = new mongoose.Schema({
    firstName: {type:String, required: true},
    lastName: {type: String},
    email: {type: String, required: true, unique: true},
    teacherId: {type:String, required: true, unique: true},
    phone: {type: String, required: true},
    address: {type: String, required: true},
    allotedClass: {type: String, required: true},
    qualification: {type: String, required: true},
    password: {type: String, required: true},
    status: {type: String, enum: ["active", "inactive", "suspended"], default: "active"},
    verified: {type: Boolean, default: true},
    archived: {type: Boolean, default: false},
    aadharId: {type: String, required: true,},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'Admin'},
    joiningDate: {type: String}
}) 

module.exports = mongoose.model('Teacher', teacherSchema);