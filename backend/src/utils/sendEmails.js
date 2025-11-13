require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const nodemailer = require('nodemailer');
async function sendEmail(to, subject, content, isHtml = false) {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.FROM_EMAIL,
            to,
            subject,
            [isHtml ? 'html' : 'text']: content,
        }

        await transporter.sendMail(mailOptions)
    } catch(err) {
        console.warn('Email sent failed');
    }
}
console.log(process.env.SMTP_HOST);

module.exports = sendEmail;