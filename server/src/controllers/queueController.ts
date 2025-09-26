import { Request, Response } from 'express';
import pool from '../config/database';
import { NotificationService } from '../services/notificationService';
import { telegramBotService } from '../services/telegramBotService';
import { validateQueueUpdate } from '../services/validationService';

interface QueueUpdate {
  currentUserPattern: string;
  rawContent?: string;
  timestamp?: Date;
}

export class QueueController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  // Endpoint for browser extension to update queue status
  public async updateQueueStatus(req: Request, res: Response): Promise<Response | void> {
    try {
      const { currentUserPattern, rawContent } = req.body;

      // Validate input
      const { error } = validateQueueUpdate({ currentUserPattern, rawContent });
      if (error) {
        return res.status(400).json({ 
          error: 'Invalid queue update data', 
          details: error.details.map((d: any) => d.message) 
        });
      }

      // Store queue status in database
      await pool.query(
        `INSERT INTO queue_status (current_user_pattern, raw_content, timestamp) 
         VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [currentUserPattern, rawContent || '']
      );

      // Check if any users match this pattern and need notification
      const usersResult = await pool.query(
        `SELECT id, username, email, notified, telegram_username, telegram_chat_id 
         FROM users 
         WHERE username_pattern = $1 AND is_active = true`,
        [currentUserPattern]
      );

      let notificationsSent = 0;
      const emailsSent: string[] = [];
      const uniqueEmails = new Set<string>();

      if (usersResult.rows.length > 0) {
        console.log(`🎯 Found ${usersResult.rows.length} matching user(s) for pattern: ${currentUserPattern}`);
        
        for (const user of usersResult.rows) {
          // Only notify if not already notified
          if (!user.notified) {
            console.log(`📧 Processing notification for: ${user.username} (${user.email})`);
            
            // Check if we haven't already sent to this email address
            if (!uniqueEmails.has(user.email)) {
              try {
                // Send email notification
                await this.notificationService.sendQueueNotification(
                  user.email, 
                  user.username,
                  currentUserPattern
                );

                uniqueEmails.add(user.email);
                emailsSent.push(user.email);
                notificationsSent++;
                
                console.log(`✅ Email notification sent to ${user.email} for user ${user.username}`);
              } catch (emailError) {
                console.error(`❌ Failed to send email to ${user.email}:`, emailError);
              }
            } else {
              console.log(`ℹ️  Email already sent to ${user.email} for another username with same pattern`);
            }

            // Send Telegram notifications if user has Telegram enabled
            if (user.telegram_chat_id) {
              try {
                console.log(`📱 Sending Telegram notifications to ${user.username} (${user.telegram_username})`);
                await telegramBotService.sendSuccessiveNotifications(
                  user.telegram_chat_id,
                  user.username,
                  user.telegram_username || user.username,
                  currentUserPattern
                );
                console.log(`✅ Telegram notifications sent to ${user.username}`);
              } catch (telegramError) {
                console.error(`❌ Failed to send Telegram notifications to ${user.username}:`, telegramError);
              }
            } else if (user.telegram_username) {
              console.log(`ℹ️  User ${user.username} has Telegram username but no chat ID - they need to message the bot first`);
            }

            // Mark this specific user as notified regardless of email success
            await pool.query(
              `UPDATE users SET notified = true, updated_at = CURRENT_TIMESTAMP 
               WHERE id = $1`,
              [user.id]
            );

            // Log notification attempt
            await pool.query(
              `INSERT INTO notification_logs (user_id, notification_type, email_status) 
               VALUES ($1, 'queue_notification', 'sent')`,
              [user.id]
            );
          } else {
            console.log(`⚠️  User ${user.username} (${user.email}) already notified`);
          }
        }
        
        if (notificationsSent > 0) {
          console.log(`📧 ${notificationsSent} unique email notifications sent to: ${emailsSent.join(', ')}`);
        }
      } else {
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

    } catch (error: any) {
      console.error('Queue update error:', error);
      res.status(500).json({ 
        error: 'Failed to update queue status',
        message: error.message
      });
    }
  }

  // Get current queue status
  public async getCurrentQueueStatus(req: Request, res: Response): Promise<Response | void> {
    try {
      const result = await pool.query(
        `SELECT current_user_pattern, raw_content, timestamp 
         FROM queue_status 
         ORDER BY timestamp DESC 
         LIMIT 1`
      );

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

    } catch (error: any) {
      console.error('Get queue status error:', error);
      res.status(500).json({ 
        error: 'Failed to get queue status',
        message: error.message
      });
    }
  }

  // Get queue history
  public async getQueueHistory(req: Request, res: Response): Promise<Response | void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await pool.query(
        `SELECT current_user_pattern, raw_content, timestamp 
         FROM queue_status 
         ORDER BY timestamp DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

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

    } catch (error: any) {
      console.error('Get queue history error:', error);
      res.status(500).json({ 
        error: 'Failed to get queue history',
        message: error.message
      });
    }
  }

  // Reset notification status for testing
  public async resetNotifications(req: Request, res: Response): Promise<Response | void> {
    try {
      await pool.query(`UPDATE users SET notified = false`);
      
      res.json({ 
        success: true, 
        message: 'All notification statuses reset' 
      });

    } catch (error: any) {
      console.error('Reset notifications error:', error);
      res.status(500).json({ 
        error: 'Failed to reset notifications',
        message: error.message
      });
    }
  }

  // Get notification statistics for dashboard
  public async getNotificationStats(req: Request, res: Response): Promise<Response | void> {
    try {
      // Get total notifications sent from notification_logs table
      const totalResult = await pool.query(
        `SELECT COUNT(*) as total_notifications_sent FROM notification_logs WHERE email_status = 'sent'`
      );

      // Get notifications sent today
      const todayResult = await pool.query(
        `SELECT COUNT(*) as notifications_today FROM notification_logs 
         WHERE email_status = 'sent' AND DATE(sent_at) = CURRENT_DATE`
      );

      // Get notifications by method (email vs telegram)
      const methodResult = await pool.query(
        `SELECT 
           notification_method,
           COUNT(*) as count
         FROM notification_logs 
         WHERE email_status = 'sent' 
         GROUP BY notification_method`
      );

      const stats = {
        totalNotificationsSent: parseInt(totalResult.rows[0]?.total_notifications_sent || '0'),
        notificationsToday: parseInt(todayResult.rows[0]?.notifications_today || '0'),
        notificationsByMethod: methodResult.rows.reduce((acc: any, row: any) => {
          acc[row.notification_method] = parseInt(row.count);
          return acc;
        }, {})
      };

      res.json({ 
        success: true, 
        stats
      });

    } catch (error: any) {
      console.error('Get notification stats error:', error);
      res.status(500).json({ 
        error: 'Failed to get notification statistics',
        message: error.message
      });
    }
  }
}