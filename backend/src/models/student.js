const mongoose = require("mongoose");
const validator = require("validator");
const studentSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String },
    email: {
        type: String, unique: true, sparse: true, lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email Address " + value);

            }
        }
    },
    studentId: { type: String, required: true, unique: true },
    phone: {
        type: String, required: true,
        validate(value) {
            if (!validator.isMobilePhone(value, 'en-IN')) {
                throw new Error("Enter correct Mobile Number!");
            }
        }
    },
    password: {
        type: String, required: true,
        validate(value) {
            if (!validator.isStrongPassword(value)) {
                throw new Error("Enter a Strong Password!");
            }
        }
    },
    class: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true, enum: ["male", "female", "others"] },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    address: { type: String, required: true },
    aadharId: { type: String },
    joiningDate: { type: String },
    status: { type: String, enum: ["active", "inactive", "suspended"], required: true, default: "active" },
    enrolledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    archived: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true })

module.exports = mongoose.model("Student", studentSchema);