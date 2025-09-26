"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueController = void 0;
const database_1 = __importDefault(require("../config/database"));
const notificationService_1 = require("../services/notificationService");
const telegramBotService_1 = require("../services/telegramBotService");
const validationService_1 = require("../services/validationService");
class QueueController {
    constructor() {
        this.notificationService = new notificationService_1.NotificationService();
    }
    async updateQueueStatus(req, res) {
        try {
            const { currentUserPattern, rawContent } = req.body;
            const { error } = (0, validationService_1.validateQueueUpdate)({ currentUserPattern, rawContent });
            if (error) {
                return res.status(400).json({
                    error: 'Invalid queue update data',
                    details: error.details.map((d) => d.message)
                });
            }
            await database_1.default.query(`INSERT INTO queue_status (current_user_pattern, raw_content, timestamp) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)`, [currentUserPattern, rawContent || '']);
            const usersResult = await database_1.default.query(`SELECT id, username, email, notified, telegram_username, telegram_chat_id 
         FROM users 
         WHERE username_pattern = $1 AND is_active = true`, [currentUserPattern]);
            let notificationsSent = 0;
            const emailsSent = [];
            const uniqueEmails = new Set();
            if (usersResult.rows.length > 0) {
                console.log(`🎯 Found ${usersResult.rows.length} matching user(s) for pattern: ${currentUserPattern}`);
                for (const user of usersResult.rows) {
                    if (!user.notified) {
                        console.log(`📧 Processing notification for: ${user.username} (${user.email})`);
                        if (!uniqueEmails.has(user.email)) {
                            try {
                                await this.notificationService.sendQueueNotification(user.email, user.username, currentUserPattern);
                                uniqueEmails.add(user.email);
                                emailsSent.push(user.email);
                                notificationsSent++;
                                console.log(`✅ Email notification sent to ${user.email} for user ${user.username}`);
                            }
                            catch (emailError) {
                                console.error(`❌ Failed to send email to ${user.email}:`, emailError);
                            }
                        }
                        else {
                            console.log(`ℹ️  Email already sent to ${user.email} for another username with same pattern`);
                        }
                        if (user.telegram_chat_id) {
                            try {
                                console.log(`📱 Sending Telegram notifications to ${user.username} (${user.telegram_username})`);
                                await telegramBotService_1.telegramBotService.sendSuccessiveNotifications(user.telegram_chat_id, user.username, user.telegram_username || user.username, currentUserPattern);
                                console.log(`✅ Telegram notifications sent to ${user.username}`);
                            }
                            catch (telegramError) {
                                console.error(`❌ Failed to send Telegram notifications to ${user.username}:`, telegramError);
                            }
                        }
                        else if (user.telegram_username) {
                            console.log(`ℹ️  User ${user.username} has Telegram username but no chat ID - they need to message the bot first`);
                        }
                        await database_1.default.query(`UPDATE users SET notified = true, updated_at = CURRENT_TIMESTAMP 
               WHERE id = $1`, [user.id]);
                        await database_1.default.query(`INSERT INTO notification_logs (user_id, notification_type, email_status) 
               VALUES ($1, 'queue_notification', 'sent')`, [user.id]);
                    }
                    else {
                        console.log(`⚠️  User ${user.username} (${user.email}) already notified`);
                    }
                }
                if (notificationsSent > 0) {
                    console.log(`📧 ${notificationsSent} unique email notifications sent to: ${emailsSent.join(', ')}`);
                }
            }
            else {
                console.log(`❌ No matching users found for pattern: ${currentUserPattern}`);
            }
            res.json({
                success: true,
                message: 'Queue status updated successfully',
                currentUserPattern,
                usersFound: usersResult.rows.length,
                notificationsSent,
                emailsSent,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Queue update error:', error);
            res.status(500).json({
                error: 'Failed to update queue status',
                message: error.message
            });
        }
    }
    async getCurrentQueueStatus(req, res) {
        try {
            const result = await database_1.default.query(`SELECT current_user_pattern, raw_content, timestamp 
         FROM queue_status 
         ORDER BY timestamp DESC 
         LIMIT 1`);
            if (result.rows.length === 0) {
                return res.status(404).json({
                    error: 'No queue status available'
                });
            }
            const status = result.rows[0];
            res.json({
                currentUserPattern: status.current_user_pattern,
                rawContent: status.raw_content,
                timestamp: status.timestamp
            });
        }
        catch (error) {
            console.error('Get queue status error:', error);
            res.status(500).json({
                error: 'Failed to get queue status',
                message: error.message
            });
        }
    }
    async getQueueHistory(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const result = await database_1.default.query(`SELECT current_user_pattern, raw_content, timestamp 
         FROM queue_status 
         ORDER BY timestamp DESC 
         LIMIT $1 OFFSET $2`, [limit, offset]);
            const history = result.rows.map(row => ({
                currentUserPattern: row.current_user_pattern,
                rawContent: row.raw_content,
                timestamp: row.timestamp
            }));
            res.json({
                history,
                count: history.length,
                limit,
                offset
            });
        }
        catch (error) {
            console.error('Get queue history error:', error);
            res.status(500).json({
                error: 'Failed to get queue history',
                message: error.message
            });
        }
    }
    async resetNotifications(req, res) {
        try {
            await database_1.default.query(`UPDATE users SET notified = false`);
            res.json({
                success: true,
                message: 'All notification statuses reset'
            });
        }
        catch (error) {
            console.error('Reset notifications error:', error);
            res.status(500).json({
                error: 'Failed to reset notifications',
                message: error.message
            });
        }
    }
    async getNotificationStats(req, res) {
        try {
            const totalResult = await database_1.default.query(`SELECT COUNT(*) as total_notifications_sent FROM notification_logs WHERE email_status = 'sent'`);
            const todayResult = await database_1.default.query(`SELECT COUNT(*) as notifications_today FROM notification_logs 
         WHERE email_status = 'sent' AND DATE(sent_at) = CURRENT_DATE`);
            const methodResult = await database_1.default.query(`SELECT 
           notification_method,
           COUNT(*) as count
         FROM notification_logs 
         WHERE email_status = 'sent' 
         GROUP BY notification_method`);
            const stats = {
                totalNotificationsSent: parseInt(totalResult.rows[0]?.total_notifications_sent || '0'),
                notificationsToday: parseInt(todayResult.rows[0]?.notifications_today || '0'),
                notificationsByMethod: methodResult.rows.reduce((acc, row) => {
                    acc[row.notification_method] = parseInt(row.count);
                    return acc;
                }, {})
            };
            res.json({
                success: true,
                stats
            });
        }
        catch (error) {
            console.error('Get notification stats error:', error);
            res.status(500).json({
                error: 'Failed to get notification statistics',
                message: error.message
            });
        }
    }
}
exports.QueueController = QueueController;
