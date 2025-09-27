import { Request, Response } from 'express';
import pool from '../config/database';
import { validateUserRegistration } from '../services/validationService';
import { telegramBotService } from '../services/telegramBotService';

interface User {
  id: number;
  username: string;
  username_pattern: string;
  email: string;
  telegram_username?: string;
  telegram_chat_id?: number;
  is_active: boolean;
  notified: boolean;
  created_at: Date;
  updated_at: Date;
}

class UserController {
  // Convert username to pattern (first 4 + last 3 format: abcd..xyz)
  private generateUsernamePattern(username: string): string {
    if (username.length < 7) {
      throw new Error('Username must be at least 7 characters long');
    }
    
    const firstFour = username.substring(0, 4);
    const lastThree = username.substring(username.length - 3);
    return `${firstFour}..${lastThree}`;
  }

  // Generate alternative pattern (first 4 + second-to-last 3 format: abcd..uvw)
  private generateAlternativePattern(username: string): string | null {
    if (username.length < 7) {
      return null;
    }
    
    const firstFour = username.substring(0, 4);
    // Get 3 characters ending at second-to-last position
    const secondToLastThree = username.substring(username.length - 4, username.length - 1);
    return `${firstFour}..${secondToLastThree}`;
  }

  registerUser = async (req: Request, res: Response) => {
    const { username, email, telegramUsername } = req.body;
    
    try {
      // Validate input
      const { error } = validateUserRegistration({ username, email });
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details.map(d => d.message) 
        });
      }

      // Validate Telegram username if provided (optional field)
      if (telegramUsername && !this.validateTelegramUsername(telegramUsername)) {
        return res.status(400).json({ 
          error: 'Invalid Telegram username format. Should start with @ or be plain username' 
        });
      }

      // Generate username patterns
      const usernamePattern = this.generateUsernamePattern(username);
      const alternativePattern = this.generateAlternativePattern(username);

      // Check if this specific username already exists (username must still be unique globally) - case insensitive
      const existingUsername = await pool.query(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1)',
        [username]
      );

      if (existingUsername.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Username already exists. Please choose a different username.' 
        });
      }

      // Check if this username-email combination already exists - case insensitive
      const existingCombination = await pool.query(
        'SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND LOWER(email) = LOWER($2)',
        [username, email.toLowerCase()]
      );

      if (existingCombination.rows.length > 0) {
        return res.status(409).json({ 
          error: 'This username is already registered with this email address.' 
        });
      }

      // Clean telegram username (remove @ if present)
      const cleanTelegramUsername = telegramUsername ? 
        telegramUsername.replace('@', '') : null;

      // 🎯 NEW LOGIC: Check if this Telegram username already has a chat_id in the database
      let existingChatId = null;
      if (cleanTelegramUsername) {
        console.log(`🔍 Checking for existing chat_id for Telegram username: ${cleanTelegramUsername}`);
        
        const existingTelegramUser = await pool.query(
          'SELECT telegram_chat_id FROM users WHERE LOWER(telegram_username) = LOWER($1) AND telegram_chat_id IS NOT NULL ORDER BY created_at DESC LIMIT 1',
          [cleanTelegramUsername]
        );

        if (existingTelegramUser.rows.length > 0) {
          existingChatId = existingTelegramUser.rows[0].telegram_chat_id;
          console.log(`✅ Found existing chat_id for ${cleanTelegramUsername}: ${existingChatId}`);
        } else {
          console.log(`ℹ️ No existing chat_id found for ${cleanTelegramUsername}`);
        }
      }

      // Insert new user with existing chat_id if available
      const result = await pool.query(
        `INSERT INTO users (username, username_pattern, alternative_pattern, email, telegram_username, telegram_chat_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, username, username_pattern, alternative_pattern, email, telegram_username, telegram_chat_id, is_active, created_at`,
        [username, usernamePattern, alternativePattern, email.toLowerCase(), cleanTelegramUsername, existingChatId]
      );

      const newUser = result.rows[0];

      // Send welcome message if chat_id already exists
      let welcomeMessageSent = false;
      if (existingChatId && cleanTelegramUsername) {
        try {
          welcomeMessageSent = await telegramBotService.sendWelcomeMessage(
            cleanTelegramUsername, 
            existingChatId,
            username
          );
          console.log(`📱 Welcome message ${welcomeMessageSent ? 'sent' : 'failed'} to existing chat_id: ${existingChatId}`);
        } catch (error) {
          console.error(`❌ Failed to send welcome message:`, error);
        }
      }

      // Get Telegram bot info for initialization
      const telegramBotInfo = telegramBotService.getServiceStatus();
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          username: newUser.username,
          usernamePattern: newUser.username_pattern,
          email: newUser.email,
          telegramUsername: newUser.telegram_username,
          telegramChatId: newUser.telegram_chat_id,
          isActive: newUser.is_active,
          createdAt: newUser.created_at
        },
        telegram: {
          chatIdFound: !!existingChatId,
          chatId: existingChatId,
          status: existingChatId ? 'linked' : (cleanTelegramUsername ? 'needs_initialization' : 'not_configured'),
          message: existingChatId 
            ? `Telegram account already linked! You'll receive notifications immediately.`
            : cleanTelegramUsername 
              ? `Please message @${telegramBotInfo.botUsername} to activate notifications`
              : 'No Telegram username provided'
        },
        telegramBot: telegramBotInfo.enabled ? {
          botUsername: telegramBotInfo.botUsername,
          initLink: telegramBotInfo.initLink,
          enabled: true
        } : {
          enabled: false,
          message: 'Telegram bot not configured'
        }
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'Failed to register user',
        message: error.message
      });
    }
  }

  // Validate Telegram username format
  private validateTelegramUsername(telegramUsername: string): boolean {
    // Telegram usernames are 5-32 characters, alphanumeric + underscores
    const cleanUsername = telegramUsername.replace('@', '');
    const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/;
    return telegramRegex.test(cleanUsername);
  }



  getUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT id, username, username_pattern, email, is_active, notified, created_at, updated_at 
         FROM users WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      res.json({
        id: user.id,
        username: user.username,
        usernamePattern: user.username_pattern,
        email: user.email,
        isActive: user.is_active,
        notified: user.notified,
        createdAt: user.created_at,
        updatedAt: user.updated_at
      });

    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch user',
        message: error.message
      });
    }
  }

  getAllUsers = async (req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT id, username, username_pattern, email, is_active, notified, created_at 
         FROM users 
         ORDER BY created_at DESC`
      );

      const users = result.rows.map(user => ({
        id: user.id,
        username: user.username,
        usernamePattern: user.username_pattern,
        email: user.email,
        isActive: user.is_active,
        notified: user.notified,
        createdAt: user.created_at
      }));

      res.json({ users, count: users.length });

    } catch (error: any) {
      console.error('Get all users error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch users',
        message: error.message
      });
    }
  }

  findByUsernamePattern = async (req: Request, res: Response) => {
    const { pattern } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT id, username, email, is_active, notified 
         FROM users 
         WHERE UPPER(username_pattern) = UPPER($1) AND is_active = true
         ORDER BY created_at ASC`,
        [pattern]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No active users found with this pattern' });
      }

      const users = result.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        isActive: user.is_active,
        notified: user.notified
      }));

      res.json({
        pattern,
        users,
        count: users.length
      });

    } catch (error: any) {
      console.error('Find by pattern error:', error);
      res.status(500).json({ 
        error: 'Failed to find users by pattern',
        message: error.message
      });
    }
  }

  findByEmail = async (req: Request, res: Response) => {
    const { email } = req.params;
    
    try {
      const result = await pool.query(
        `SELECT id, username, username_pattern, email, is_active, notified, created_at 
         FROM users 
         WHERE LOWER(email) = LOWER($1)
         ORDER BY created_at ASC`,
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No users found with this email address' });
      }

      const users = result.rows.map(user => ({
        id: user.id,
        username: user.username,
        usernamePattern: user.username_pattern,
        email: user.email,
        isActive: user.is_active,
        notified: user.notified,
        createdAt: user.created_at
      }));

      res.json({
        email,
        users,
        count: users.length
      });

    } catch (error: any) {
      console.error('Find by email error:', error);
      res.status(500).json({ 
        error: 'Failed to find users by email',
        message: error.message
      });
    }
  }

  updateNotificationStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { notified } = req.body;
    
    try {
      const result = await pool.query(
        `UPDATE users SET notified = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, username, notified`,
        [notified, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      res.json({
        message: 'Notification status updated',
        user: {
          id: user.id,
          username: user.username,
          notified: user.notified
        }
      });

    } catch (error: any) {
      console.error('Update notification status error:', error);
      res.status(500).json({ 
        error: 'Failed to update notification status',
        message: error.message
      });
    }
  }

  // Test Telegram functionality
  testTelegram = async (req: Request, res: Response) => {
    const { telegramUsername } = req.body;
    
    try {
      if (!telegramUsername) {
        return res.status(400).json({ 
          error: 'Telegram username is required for testing' 
        });
      }

      if (!this.validateTelegramUsername(telegramUsername)) {
        return res.status(400).json({ 
          error: 'Invalid Telegram username format' 
        });
      }

      if (!telegramBotService.isServiceEnabled()) {
        return res.status(503).json({ 
          error: 'Telegram bot service is not enabled. Please configure bot token.' 
        });
      }

      const cleanUsername = telegramUsername.replace('@', '');
      const success = await telegramBotService.testNotification(cleanUsername);

      res.json({
        success,
        message: success 
          ? 'Test Telegram message sent successfully!' 
          : 'Failed to send test message. Make sure the user has initialized the bot.',
        telegramUsername: cleanUsername,
        serviceStatus: telegramBotService.getServiceStatus()
      });

    } catch (error: any) {
      console.error('Telegram test error:', error);
      res.status(500).json({ 
        error: 'Failed to test Telegram service',
        message: error.message
      });
    }
  }

  // Get Telegram bot status and info
  getTelegramStatus = async (req: Request, res: Response) => {
    try {
      const status = telegramBotService.getServiceStatus();
      res.json({
        telegramBot: {
          enabled: status.enabled,
          botUsername: status.botUsername,
          initLink: status.initLink,
          ready: telegramBotService.isServiceEnabled()
        }
      });
    } catch (error: any) {
      console.error('Get Telegram status error:', error);
      res.status(500).json({ 
        error: 'Failed to get Telegram status',
        message: error.message
      });
    }
  }
}

export default new UserController();