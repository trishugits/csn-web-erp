const Student = require("../models/student");
const validator = require("validator");
const validateStudentDetails = async (req) => {
    const {
        firstName,
            lastName,
            email,
            phone,
            dob,
            studentId,
            password: passwordHash,
            gender,
            fatherName,
            motherName,
            address,
            class: className
    } = req.body;
    if (!firstName || !lastName || !email || !dob || !address || !phone || !studentId || !className || !fatherName || !motherName || !password || !gender || !aadharId || !joiningDate){
        throw new Error("Missing Details");
    }
    if (!validator.isMobilePhone(phone, 'en-IN')){
        throw new Error("Invalid Phone number");
    }
    if (!validator.isEmail(email)){
        throw new Error("Invalid Email");
    }
    const existingStudent = await studentId.findOne({ studentId });
    if (existingStudent){
        throw new Error("Student already exists");
    }
}

module.exports = {validateStudentDetails}