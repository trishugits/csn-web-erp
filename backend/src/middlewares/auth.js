const jwt = require("jsonwebtoken");
const Student = require("../models/student");
const Teacher = require("../models/teacher");
const Admin = require("../models/admin");

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env')});

module.exports = async function (req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header) return res.status(401).json({message: "No tokens provided"});
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {id: decoded.id, role: decoded.role};
        if (decoded.role === "student") req.user.profile = await Student.findById(decoded.id);
        if (decoded.role === "teacher") req.user.profile = await Teacher.findById(decoded.id);
        if (decoded.role === "admin") req.user.profile = await Admin.findById(decoded.id);
        next();
    } catch (err) {
        res.status(401).json({message: "Invalid Token", error: err.message});
    }
}