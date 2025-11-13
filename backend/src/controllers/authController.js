const Admin = require("../models/admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Teacher = require("../models/teacher");
const OTP = require("../models/otp");
const crypto = require("crypto");
const passwordResetToken = require("../models/passwordResetToken");
const Student = require("../models/student");
const sendEmail = require('../utils/sendEmails')
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env')});
const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY || '600', 10) ;

function signJwtToken(id, role) {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {expiresIn: '1d'});
}

exports.adminLogin = async(req, res) => {
    try {
        const { identifier, password,} = req.body;
        if(!identifier || !password) return res.status(401).json({message: "Missing Fields"});
        const isMail = identifier.includes('@');
        const admin = isMail ? await Admin.findOne({email: identifier}) : await Admin.findOne({ adminId: identifier });
        if (!admin) return res.status(400).json({message: "Admin did not exist"});
        const ok = await bcrypt.compare(password, admin.password);
        if (!ok) return res.status(400).json({ message: "Invalid credentials"});
        res.json({token: signJwtToken(admin._id, 'admin')})
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.teacherLogin = async(req, res) => {
    try {
        const { identifier, password,} = req.body;
        if(!identifier || !password) return res.status(401).json({message: "Missing Fields"});
        const isMail = identifier.includes('@');
        const teacher = isMail ? await Teacher.findOne({email: identifier}) : await Teacher.findOne({ teacherId: identifier });
        if(!teacher) return res.status(400).json({message: "Teacher did not exist"});
        const ok = await bcrypt.compare(password, teacher.password);
        if (!ok) return res.status(400).json({ message: "Invalid credentials"});
        res.json({token: signJwtToken(teacher._id, 'teacher')})
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.studentLogin = async(req,res) => {
    try {
        const { identifier, password } = req.body;
        if(!identifier || !password) return res.status(401).json({message: "Missing Fields"});
        const isMail = identifier.includes('@');
        const student = isMail ? await Student.findOne({email: identifier}) : await Student.findOne({ studentId: identifier });
        if(!student) return res.status(400).json({message: "Student did not exist"});
        const ok = await bcrypt.compare(password, student.password);
        if (!ok) return res.status(400).json({ message: "Invalid credentials"});
        res.json({token: signJwtToken(student._id, 'student')})
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.verifyOtp = async(req, res) => {
    try {
        const {target, otp} = req.body;
        
        if(!target || !otp) return res.status(401).json({message: "Missing Fields"});
        const rec = await OTP.findOne({target, otp, used: false, expiresAt: { $gt : new Date()}});
        if(!rec) return res.status(401).json({message: "Invalid OTP or expired OTP"});
        rec.used = true;
        await rec.save();
        await passwordResetToken.deleteMany({target});
        const resetToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
        await passwordResetToken.create({
            target,
            token: crypto.createHash('sha256').update(resetToken).digest('hex'),
            expiresAt: tokenExpiry, 
        })
        res.json({message: 'OTP verified', resetToken, target});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
}

exports.resetPassword = async(req, res) => {
    try {
        const {target, newPassword, token} = req.body;
        if(!target || !newPassword || !token) return res.status(401).json({message: "Missing Fields"});
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const hashPassword = await bcrypt.hash(newPassword, 10);
        const validToken = await passwordResetToken.findOne({
            target,
            token: hashedToken,
            expiresAt: { $gt: new Date() } 
        });
        if (!validToken) {
            return res.status(401).json({ message: "Invalid or expired reset token" });
        }
        await Admin.updateOne({email : target}, { $set: {password: hashPassword}});
        await Teacher.updateOne({email : target}, { $set: {password: hashPassword}});
        await Student.updateOne({email : target}, { $set: {password: hashPassword}});

        await passwordResetToken.deleteMany({ target });

        res.json({message: "If account exists, password reset"});
    } catch (err) {
        res.status(500).json(err.message);
    }
}

exports.resetPasswordRequest = async(req, res) => {
    try{
        const { target } = req.body;
        if (!target) return res.json({message: "Missing Field"});
        const otp = (Math.floor(100000 + Math.random()*900000)).toString();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY * 1000);
        await OTP.create({target, otp, expiresAt});
        const html = `
            <div style="font-family: Arial, sans-serif; background-color:#f4f4f4; padding:20px;">
                <div style="max-width:500px; background:#ffffff; margin:0 auto; border-radius:10px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                    <div style="background-color:#4A90E2; color:#fff; padding:15px 20px; text-align:center;">
                        <h2>Password Reset Verification</h2>
                    </div>
                    <div style="padding:20px; text-align:center;">
                        <p style="font-size:16px; color:#333;">Hello 👋,</p>
                        <p style="font-size:15px; color:#555;">
                            We received a request to reset your password. Use the following OTP to proceed:
                        </p>
                        <div style="font-size:28px; font-weight:bold; letter-spacing:3px; color:#4A90E2; margin:20px 0;">
                            ${otp}
                        </div>
                        <p style="font-size:14px; color:#777;">
                            This OTP is valid for <b>${OTP_EXPIRY / 60} minutes</b>.
                            Please do not share it with anyone.
                        </p>
                    </div>
                    <div style="background-color:#f4f4f4; padding:10px 0; text-align:center; font-size:12px; color:#999;">
                        <p>If you did not request a password reset, you can ignore this email.</p>
                        <p>© ${new Date().getFullYear()} CSN. All rights reserved.</p>
                    </div>
                </div>
            </div>
        `;
        await sendEmail(target, 'Your OTP for password Reset', html, true);
        res.json({message: "OTP sent if target exists"});
    } catch(err){
        res.status(500).json({message: err.message});
    }
}