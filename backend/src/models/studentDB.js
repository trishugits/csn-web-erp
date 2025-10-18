const mongoose = require("mongoose");
const validator = require("validator");
const studentSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email Address " + value);
                
            }
        } 
    },
    studentId: {
        type: String,
        required: true,
        unique: true

    },
    phone: {
        type: String,
        required: true,
        validate(value) {
            if(!validator.isMobilePhone(value, 'en-IN')){
                throw new Error("Enter correct Mobile Number!");
            }
        }

    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if(!validator.isStrongPassword(value)){
                throw new Error("Enter a Strong Password!");
            }
        }
    },
    class: {
        type: String,
        required: true
    },
    dob: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    fatherName: {
        type: String,
        required: true
    },
    motherName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    }
}, {timestamps: true})

module.exports = mongoose.model("Student", studentSchema);