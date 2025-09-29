"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const validationService_1 = require("../services/validationService");
const telegramBotService_1 = require("../services/telegramBotService");
class UserController {
    constructor() {
        this.registerUser = async (req, res) => {
            const { username, email, telegramUsername } = req.body;
            try {
                const { error } = (0, validationService_1.validateUserRegistration)({ username, email });
                if (error) {
                    return res.status(400).json({
                        error: 'Validation failed',
                        details: error.details.map(d => d.message)
                    });
                }
                if (telegramUsername && !this.validateTelegramUsername(telegramUsername)) {
                    return res.status(400).json({
                        error: 'Invalid Telegram username format. Should start with @ or be plain username'
                    });
                }
                const usernamePattern = this.generateUsernamePattern(username);
                const alternativePattern = this.generateAlternativePattern(username);
                const existingUsername = await database_1.default.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1)', [username]);
                if (existingUsername.rows.length > 0) {
                    return res.status(409).json({
                        error: 'Username already exists. Please choose a different username.'
                    });
                }
                const existingCombination = await database_1.default.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND LOWER(email) = LOWER($2)', [username, email.toLowerCase()]);
                if (existingCombination.rows.length > 0) {
                    return res.status(409).json({
                        error: 'This username is already registered with this email address.'
                    });
                }
                const cleanTelegramUsername = telegramUsername ?
                    telegramUsername.replace('@', '') : null;
                let existingChatId = null;
                if (cleanTelegramUsername) {
                    console.log(`🔍 Checking for existing chat_id for Telegram username: ${cleanTelegramUsername}`);
                    const existingTelegramUser = await database_1.default.query('SELECT telegram_chat_id FROM users WHERE LOWER(telegram_username) = LOWER($1) AND telegram_chat_id IS NOT NULL ORDER BY created_at DESC LIMIT 1', [cleanTelegramUsername]);
                    if (existingTelegramUser.rows.length > 0) {
                        existingChatId = existingTelegramUser.rows[0].telegram_chat_id;
                        console.log(`✅ Found existing chat_id for ${cleanTelegramUsername}: ${existingChatId}`);
                    }
                    else {
                        console.log(`ℹ️ No existing chat_id found for ${cleanTelegramUsername}`);
                    }
                }
                const result = await database_1.default.query(`INSERT INTO users (username, username_pattern, alternative_pattern, email, telegram_username, telegram_chat_id) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING id, username, username_pattern, alternative_pattern, email, telegram_username, telegram_chat_id, is_active, created_at`, [username, usernamePattern, alternativePattern, email.toLowerCase(), cleanTelegramUsername, existingChatId]);
                const newUser = result.rows[0];
                let welcomeMessageSent = false;
                if (existingChatId && cleanTelegramUsername) {
                    try {
                        welcomeMessageSent = await telegramBotService_1.telegramBotService.sendWelcomeMessage(cleanTelegramUsername, existingChatId, username);
                        console.log(`📱 Welcome message ${welcomeMessageSent ? 'sent' : 'failed'} to existing chat_id: ${existingChatId}`);
                    }
                    catch (error) {
                        console.error(`❌ Failed to send welcome message:`, error);
                    }
                }
                const telegramBotInfo = telegramBotService_1.telegramBotService.getServiceStatus();
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
            }
            catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({
                    error: 'Failed to register user',
                    message: error.message
                });
            }
        };
        this.getUser = async (req, res) => {
            const { id } = req.params;
            try {
                const result = await database_1.default.query(`SELECT id, username, username_pattern, email, is_active, notified, created_at, updated_at 
         FROM users WHERE id = $1`, [id]);
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
            }
            catch (error) {
                console.error('Get user error:', error);
                res.status(500).json({
                    error: 'Failed to fetch user',
                    message: error.message
                });
            }
        };
        this.getAllUsers = async (req, res) => {
            try {
                const result = await database_1.default.query(`SELECT id, username, username_pattern, email, is_active, notified, created_at 
         FROM users 
         ORDER BY created_at DESC`);
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
            }
            catch (error) {
                console.error('Get all users error:', error);
                res.status(500).json({
                    error: 'Failed to fetch users',
                    message: error.message
                });
            }
        };
        this.findByUsernamePattern = async (req, res) => {
            const { pattern } = req.params;
            try {
                const result = await database_1.default.query(`SELECT id, username, email, is_active, notified 
         FROM users 
         WHERE UPPER(username_pattern) = UPPER($1) AND is_active = true
         ORDER BY created_at ASC`, [pattern]);
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
            }
            catch (error) {
                console.error('Find by pattern error:', error);
                res.status(500).json({
                    error: 'Failed to find users by pattern',
                    message: error.message
                });
            }
        };
        this.findByEmail = async (req, res) => {
            const { email } = req.params;
            try {
                const result = await database_1.default.query(`SELECT id, username, username_pattern, email, is_active, notified, created_at 
         FROM users 
         WHERE LOWER(email) = LOWER($1)
         ORDER BY created_at ASC`, [email]);
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
            }
            catch (error) {
                console.error('Find by email error:', error);
                res.status(500).json({
                    error: 'Failed to find users by email',
                    message: error.message
                });
            }
        };
        this.updateNotificationStatus = async (req, res) => {
            const { id } = req.params;
            const { notified } = req.body;
            try {
                const result = await database_1.default.query(`UPDATE users SET notified = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, username, notified`, [notified, id]);
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
            }
            catch (error) {
                console.error('Update notification status error:', error);
                res.status(500).json({
                    error: 'Failed to update notification status',
                    message: error.message
                });
            }
        };
        this.testTelegram = async (req, res) => {
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
                if (!telegramBotService_1.telegramBotService.isServiceEnabled()) {
                    return res.status(503).json({
                        error: 'Telegram bot service is not enabled. Please configure bot token.'
                    });
                }
                const cleanUsername = telegramUsername.replace('@', '');
                const success = await telegramBotService_1.telegramBotService.testNotification(cleanUsername);
                res.json({
                    success,
                    message: success
                        ? 'Test Telegram message sent successfully!'
                        : 'Failed to send test message. Make sure the user has initialized the bot.',
                    telegramUsername: cleanUsername,
                    serviceStatus: telegramBotService_1.telegramBotService.getServiceStatus()
                });
            }
            catch (error) {
                console.error('Telegram test error:', error);
                res.status(500).json({
                    error: 'Failed to test Telegram service',
                    message: error.message
                });
            }
        };
        this.getTelegramStatus = async (req, res) => {
            try {
                const status = telegramBotService_1.telegramBotService.getServiceStatus();
                res.json({
                    telegramBot: {
                        enabled: status.enabled,
                        botUsername: status.botUsername,
                        initLink: status.initLink,
                        ready: telegramBotService_1.telegramBotService.isServiceEnabled()
                    }
                });
            }
            catch (error) {
                console.error('Get Telegram status error:', error);
                res.status(500).json({
                    error: 'Failed to get Telegram status',
                    message: error.message
                });
            }
        };
    }
    generateUsernamePattern(username) {
        if (username.length < 7) {
            throw new Error('Username must be at least 7 characters long');
        }
        const firstFour = username.substring(0, 4);
        const lastThree = username.substring(username.length - 3);
        return `${firstFour}..${lastThree}`;
    }
    generateAlternativePattern(username) {
        if (username.length < 7) {
            return null;
        }
        const firstFour = username.substring(0, 4);
        const secondToLastThree = username.substring(username.length - 4, username.length - 1);
        return `${firstFour}..${secondToLastThree}`;
    }
    validateTelegramUsername(telegramUsername) {
        const cleanUsername = telegramUsername.replace('@', '');
        const telegramRegex = /^[a-zA-Z0-9_]{5,32}$/;
        return telegramRegex.test(cleanUsername);
    }
}
exports.default = new UserController();
