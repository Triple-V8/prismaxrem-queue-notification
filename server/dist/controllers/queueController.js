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
            const { currentUserPattern, topUsers, rawContent } = req.body;
            const { error } = (0, validationService_1.validateQueueUpdate)({ currentUserPattern, rawContent });
            if (error) {
                return res.status(400).json({
                    error: 'Invalid queue update data',
                    details: error.details.map((d) => d.message)
                });
            }
            await database_1.default.query(`INSERT INTO queue_status (current_user_pattern, raw_content, timestamp) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)`, [currentUserPattern, rawContent || '']);
            await database_1.default.query(`UPDATE users 
         SET notified = false 
         WHERE (UPPER(username_pattern) != UPPER($1) AND UPPER(COALESCE(alternative_pattern, '')) != UPPER($1))
         AND notified = true`, [currentUserPattern]);
            console.log(`🔄 Reset notification status for users not matching pattern: ${currentUserPattern}`);
            let notificationsSent = 0;
            const emailsSent = [];
            const uniqueEmails = new Set();
            let usersFound = 0;
            if (topUsers && Array.isArray(topUsers) && topUsers.length > 0) {
                console.log(`🏆 Processing top ${topUsers.length} users for position-based notifications`);
                for (const topUser of topUsers) {
                    const { position, userPattern } = topUser;
                    const usersResult = await database_1.default.query(`SELECT id, username, email, notified, telegram_username, telegram_chat_id, username_pattern, alternative_pattern, last_notified
             FROM users 
             WHERE (UPPER(username_pattern) = UPPER($1) OR UPPER(alternative_pattern) = UPPER($1)) 
             AND is_active = true
             AND (
               notified = false 
               OR last_notified IS NULL 
               OR last_notified < NOW() - INTERVAL '30 minutes'
             )`, [userPattern]);
                    if (usersResult.rows.length > 0) {
                        console.log(`🎯 Position ${position}: Found ${usersResult.rows.length} matching user(s) for pattern: ${userPattern}`);
                        usersFound += usersResult.rows.length;
                        for (const user of usersResult.rows) {
                            const now = new Date();
                            const lastNotified = user.last_notified ? new Date(user.last_notified) : null;
                            const timeSinceLastNotification = lastNotified ? (now.getTime() - lastNotified.getTime()) / (1000 * 60) : Infinity;
                            console.log(`📧 Processing position ${position} notification for: ${user.username} (${user.email}) - Last notified: ${timeSinceLastNotification.toFixed(1)} minutes ago`);
                            if (!uniqueEmails.has(user.email)) {
                                try {
                                    await this.notificationService.sendPositionNotification(user.email, user.username, userPattern, position);
                                    uniqueEmails.add(user.email);
                                    emailsSent.push(user.email);
                                    notificationsSent++;
                                    console.log(`✅ Position ${position} email notification sent to ${user.email} for user ${user.username}`);
                                }
                                catch (emailError) {
                                    console.error(`❌ Failed to send position ${position} email to ${user.email}:`, emailError);
                                }
                            }
                            else {
                                console.log(`ℹ️  Email already sent to ${user.email} for another username with same pattern`);
                            }
                            if (user.telegram_chat_id) {
                                try {
                                    console.log(`📱 Sending position ${position} Telegram notifications to ${user.username} (${user.telegram_username})`);
                                    await telegramBotService_1.telegramBotService.sendPositionNotifications(user.telegram_chat_id, user.username, user.telegram_username || user.username, userPattern, position);
                                    console.log(`✅ Position ${position} Telegram notifications sent to ${user.username}`);
                                }
                                catch (telegramError) {
                                    console.error(`❌ Failed to send position ${position} Telegram notifications to ${user.username}:`, telegramError);
                                }
                            }
                            else if (user.telegram_username) {
                                console.log(`ℹ️  User ${user.username} has Telegram username but no chat ID - they need to message the bot first`);
                            }
                            await database_1.default.query(`UPDATE users SET notified = true, last_notified = NOW(), updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`, [user.id]);
                            await database_1.default.query(`INSERT INTO notification_logs (user_id, notification_type, email_status) 
                 VALUES ($1, 'position_notification', 'sent')`, [user.id]);
                        }
                    }
                    else {
                        console.log(`❌ Position ${position}: No matching users found for pattern: ${userPattern}`);
                    }
                }
            }
            else {
                console.log(`🔄 Fallback to single pattern notification for: ${currentUserPattern}`);
                const usersResult = await database_1.default.query(`SELECT id, username, email, notified, telegram_username, telegram_chat_id, username_pattern, alternative_pattern, last_notified
           FROM users 
           WHERE (UPPER(username_pattern) = UPPER($1) OR UPPER(alternative_pattern) = UPPER($1)) 
           AND is_active = true
           AND (
             notified = false 
             OR last_notified IS NULL 
             OR last_notified < NOW() - INTERVAL '30 minutes'
           )`, [currentUserPattern]);
                if (usersResult.rows.length > 0) {
                    console.log(`🎯 Found ${usersResult.rows.length} matching user(s) for pattern: ${currentUserPattern}`);
                    usersFound = usersResult.rows.length;
                    for (const user of usersResult.rows) {
                        const now = new Date();
                        const lastNotified = user.last_notified ? new Date(user.last_notified) : null;
                        const timeSinceLastNotification = lastNotified ? (now.getTime() - lastNotified.getTime()) / (1000 * 60) : Infinity;
                        console.log(`📧 Processing notification for: ${user.username} (${user.email}) - Last notified: ${timeSinceLastNotification.toFixed(1)} minutes ago`);
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
                        if (user.telegram_chat_id) {
                            try {
                                await telegramBotService_1.telegramBotService.sendSuccessiveNotifications(user.telegram_chat_id, user.username, user.telegram_username || user.username, currentUserPattern);
                                console.log(`✅ Telegram notifications sent to ${user.username}`);
                            }
                            catch (telegramError) {
                                console.error(`❌ Failed to send Telegram notifications to ${user.username}:`, telegramError);
                            }
                        }
                        await database_1.default.query(`UPDATE users SET notified = true, last_notified = NOW(), updated_at = CURRENT_TIMESTAMP 
               WHERE id = $1`, [user.id]);
                        await database_1.default.query(`INSERT INTO notification_logs (user_id, notification_type, email_status) 
               VALUES ($1, 'queue_notification', 'sent')`, [user.id]);
                    }
                }
                else {
                    console.log(`❌ No matching users found for pattern: ${currentUserPattern}`);
                }
            }
            if (notificationsSent > 0) {
                console.log(`📧 ${notificationsSent} unique email notifications sent to: ${emailsSent.join(', ')}`);
            }
            res.json({
                success: true,
                message: 'Queue status updated successfully',
                currentUserPattern,
                usersFound,
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
            await database_1.default.query(`UPDATE users SET notified = false, last_notified = NULL`);
            res.json({
                success: true,
                message: 'All notification statuses and cooldowns reset'
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
    async resetNotificationForInactiveUsers(req, res) {
        try {
            const { currentUserPattern } = req.body;
            if (!currentUserPattern) {
                return res.status(400).json({
                    error: 'currentUserPattern is required'
                });
            }
            const result = await database_1.default.query(`UPDATE users 
         SET notified = false 
         WHERE (UPPER(username_pattern) != UPPER($1) AND UPPER(COALESCE(alternative_pattern, '')) != UPPER($1))
         AND notified = true
         RETURNING id, username, username_pattern`, [currentUserPattern]);
            console.log(`🔄 Reset notification status for ${result.rows.length} users who left the queue`);
            res.json({
                success: true,
                message: `Reset notification status for ${result.rows.length} users`,
                usersReset: result.rows.length,
                currentUserPattern
            });
        }
        catch (error) {
            console.error('Reset inactive notifications error:', error);
            res.status(500).json({
                error: 'Failed to reset inactive notifications',
                message: error.message
            });
        }
    }
    async getNotificationStats(req, res) {
        try {
            const totalResult = await database_1.default.query(`SELECT COUNT(*) as total_notifications_sent FROM notification_logs WHERE email_status = 'sent'`);
            const todayResult = await database_1.default.query(`SELECT COUNT(*) as notifications_today FROM notification_logs 
         WHERE email_status = 'sent' AND DATE(sent_at) = CURRENT_DATE`);
            let notificationsByMethod = {};
            try {
                const methodResult = await database_1.default.query(`SELECT 
             notification_method,
             COUNT(*) as count
           FROM notification_logs 
           WHERE email_status = 'sent' 
           GROUP BY notification_method`);
                notificationsByMethod = methodResult.rows.reduce((acc, row) => {
                    acc[row.notification_method] = parseInt(row.count);
                    return acc;
                }, {});
            }
            catch (columnError) {
                console.log('notification_method column not found, assuming all notifications are email');
                const totalCount = parseInt(totalResult.rows[0]?.total_notifications_sent || '0');
                notificationsByMethod = totalCount > 0 ? { email: totalCount } : {};
            }
            const stats = {
                totalNotificationsSent: parseInt(totalResult.rows[0]?.total_notifications_sent || '0'),
                notificationsToday: parseInt(todayResult.rows[0]?.notifications_today || '0'),
                notificationsByMethod
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
    async resetCooldowns(req, res) {
        try {
            const { userIds } = req.body;
            if (userIds && Array.isArray(userIds)) {
                const result = await database_1.default.query(`UPDATE users 
           SET notified = false, last_notified = NULL 
           WHERE id = ANY($1::int[])
           RETURNING id, username`, [userIds]);
                res.json({
                    success: true,
                    message: `Reset cooldowns for ${result.rows.length} specific users`,
                    usersReset: result.rows
                });
            }
            else {
                const result = await database_1.default.query(`UPDATE users 
           SET notified = false, last_notified = NULL 
           RETURNING COUNT(*) as count`);
                res.json({
                    success: true,
                    message: 'Reset cooldowns for all users',
                    usersReset: result.rows[0].count
                });
            }
        }
        catch (error) {
            console.error('Reset cooldowns error:', error);
            res.status(500).json({
                error: 'Failed to reset cooldowns',
                message: error.message
            });
        }
    }
}
exports.QueueController = QueueController;
