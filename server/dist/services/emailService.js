"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailNotification = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@example.com',
        pass: 'your-email-password',
    },
});
const sendEmailNotification = async (to, subject, text) => {
    const mailOptions = {
        from: '"Reminder App" <your-email@example.com>',
        to,
        subject,
        text,
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', to);
    }
    catch (error) {
        console.error('Error sending email:', error);
    }
};
exports.sendEmailNotification = sendEmailNotification;
//# sourceMappingURL=emailService.js.map