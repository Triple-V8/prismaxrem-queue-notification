"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const resend_1 = require("resend");
class NotificationService {
    constructor() {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is required');
        }
        this.resend = new resend_1.Resend(process.env.RESEND_API_KEY);
    }
    async sendQueueNotification(email, username, usernamePattern) {
        try {
            const { data, error } = await this.resend.emails.send({
                from: process.env.EMAIL_FROM || 'PrismaX Reminder <noreply@yourdomain.com>',
                to: [email],
                subject: '🎯 Your Turn at PrismaX AI - Robotic Arm Ready!',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">🎯 It's Your Turn!</h2>
            
            <p>Hello <strong>${username}</strong>,</p>
            
            <p>Great news! It's now your turn to teleoperate the robotic arm on PrismaX AI.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">📋 Details:</h3>
              <ul style="margin: 0;">
                <li><strong>Username:</strong> ${username}</li>
                <li><strong>Queue ID:</strong> ${usernamePattern}</li>
                <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            
            <p><strong>⚡ Quick Action Required:</strong></p>
            <p>Please return to the PrismaX AI platform immediately to begin your session. The system is waiting for you!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.PRISMAX_URL || 'https://app.prismax.ai/tele-op'}" 
                 style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                🚀 Go to PrismaX AI
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              This notification was sent because you registered for queue notifications on PrismaX AI Reminder Service.
              <br><br>
              If you no longer wish to receive these notifications, please contact support.
            </p>
          </div>
        `,
                text: `
Hello ${username},

It's your turn to teleoperate the robotic arm on PrismaX AI!

Details:
- Username: ${username}
- Queue ID: ${usernamePattern}  
- Time: ${new Date().toLocaleString()}

Please return to the PrismaX AI platform immediately to begin your session.

Visit: ${process.env.PRISMAX_URL || 'https://app.prismax.ai/tele-op'}

This notification was sent because you registered for queue notifications on PrismaX AI Reminder Service.
        `
            });
            if (error) {
                console.error('❌ Resend API error:', error);
                throw new Error(`Email notification failed: ${error.message}`);
            }
            console.log('📧 Email sent successfully:', data);
        }
        catch (error) {
            console.error('❌ Failed to send notification email:', error);
            throw new Error(`Email notification failed: ${error.message}`);
        }
    }
    async sendWelcomeEmail(email, username, usernamePattern) {
        try {
            const { data, error } = await this.resend.emails.send({
                from: process.env.EMAIL_FROM || 'PrismaX Reminder <noreply@yourdomain.com>',
                to: [email],
                subject: '✅ Welcome to PrismaX AI Reminder Service',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">✅ Registration Successful!</h2>
            
            <p>Hello <strong>${username}</strong>,</p>
            
            <p>Welcome to the PrismaX AI Reminder Service! You've successfully registered for queue notifications.</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
              <h3 style="margin-top: 0; color: #065f46;">📋 Your Registration Details:</h3>
              <ul style="margin: 0;">
                <li><strong>Username:</strong> ${username}</li>
                <li><strong>Queue Pattern:</strong> ${usernamePattern}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Registered:</strong> ${new Date().toLocaleString()}</li>
              </ul>
            </div>
            
            <p><strong>🔔 How it works:</strong></p>
            <ul>
              <li>We monitor the PrismaX AI queue in real-time</li>
              <li>When your username pattern (${usernamePattern}) appears as next in queue, you'll get notified</li>
              <li>You'll receive an email immediately when it's your turn</li>
            </ul>
            
            <p><strong>💡 Pro Tips:</strong></p>
            <ul>
              <li>Keep this email for your records</li>
              <li>Make sure to whitelist our email address</li>
              <li>Join the queue on PrismaX AI when you're ready to be monitored</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Thank you for using PrismaX AI Reminder Service!
              <br><br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        `,
                text: `
Welcome to PrismaX AI Reminder Service!

Hello ${username},

You've successfully registered for queue notifications.

Your Details:
- Username: ${username}
- Queue Pattern: ${usernamePattern}
- Email: ${email}
- Registered: ${new Date().toLocaleString()}

How it works:
- We monitor the PrismaX AI queue in real-time
- When your username pattern (${usernamePattern}) appears as next in queue, you'll get notified
- You'll receive an email immediately when it's your turn

Thank you for using PrismaX AI Reminder Service!
        `
            });
            if (error) {
                console.error('❌ Failed to send welcome email:', error);
            }
            else {
                console.log('📧 Welcome email sent successfully to:', email);
            }
        }
        catch (error) {
            console.error('❌ Failed to send welcome email:', error);
        }
    }
    async testConnection() {
        try {
            const { data, error } = await this.resend.emails.send({
                from: process.env.EMAIL_FROM || 'PrismaX Reminder <noreply@yourdomain.com>',
                to: ['test@resend.dev'],
                subject: 'Resend Connection Test',
                text: 'This is a test email to verify Resend connection.'
            });
            if (error) {
                console.error('❌ Resend connection test failed:', error);
                return false;
            }
            console.log('✅ Resend connection verified:', data);
            return true;
        }
        catch (error) {
            console.error('❌ Resend connection test failed:', error.message);
            return false;
        }
    }
}
exports.NotificationService = NotificationService;
