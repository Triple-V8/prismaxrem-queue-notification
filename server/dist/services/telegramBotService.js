"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramBotService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const database_1 = __importDefault(require("../config/database"));
class TelegramBotService {
    constructor() {
        this.bot = null;
        this.isEnabled = false;
        this.botUsername = '';
        this.initializeBot();
    }
    async initializeBot() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            console.warn('⚠️ Telegram bot token not found. Telegram notifications disabled.');
            console.log('💡 To enable Telegram: Set TELEGRAM_BOT_TOKEN in .env file');
            return;
        }
        try {
            this.bot = new node_telegram_bot_api_1.default(token, { polling: true });
            const botInfo = await this.bot.getMe();
            this.botUsername = botInfo.username || 'PrismaXBot';
            this.isEnabled = true;
            console.log(`✅ Telegram bot initialized: @${this.botUsername}`);
            this.setupMessageHandlers();
        }
        catch (error) {
            console.error('❌ Failed to initialize Telegram bot:', error);
            this.isEnabled = false;
        }
    }
    setupMessageHandlers() {
        if (!this.bot)
            return;
        this.bot.onText(/\/start/, async (msg) => {
            const chatId = msg.chat.id;
            const username = msg.from?.username;
            console.log(`📱 Telegram /start received from chat ${chatId}, username: ${username}`);
            try {
                if (username) {
                    await database_1.default.query(`UPDATE users SET telegram_chat_id = $1 
             WHERE telegram_username = $2 AND telegram_chat_id IS NULL`, [chatId, username]);
                    console.log(`✅ Chat ID ${chatId} linked to username @${username}`);
                }
                const welcomeMessage = `🎯 *Welcome to PrismaX AI Queue Monitor!*

✅ Your Telegram is now linked to the queue monitoring system.

You'll receive instant notifications when it's your turn to operate the robotic arm!

🔔 *What you'll get:*
• 5 urgent notifications over 2 minutes
• Direct link to join the queue
• Real-time updates

_If you registered with a different Telegram username, please update your registration on the website._

🤖 *Bot Status:* Active and ready!`;
                await this.bot.sendMessage(chatId, welcomeMessage, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                });
            }
            catch (error) {
                console.error('Error handling /start command:', error);
                const errorMessage = `❌ There was an error linking your Telegram account. Please make sure you're registered on the PrismaX AI website with this Telegram username (@${username}).`;
                await this.bot.sendMessage(chatId, errorMessage);
            }
        });
        this.bot.on('message', async (msg) => {
            if (msg.text && !msg.text.startsWith('/')) {
                const chatId = msg.chat.id;
                const helpMessage = `ℹ️ *PrismaX AI Queue Monitor Bot*

*Available Commands:*
/start - Link your Telegram account

*How it works:*
1. Register on the PrismaX AI website with your Telegram username
2. Click the bot initialization link
3. Send /start to this bot
4. Receive instant queue notifications!

🔗 Visit: https://app.prismax.ai`;
                await this.bot.sendMessage(chatId, helpMessage, {
                    parse_mode: 'Markdown',
                    disable_web_page_preview: true
                });
            }
        });
    }
    isServiceEnabled() {
        return this.isEnabled && this.bot !== null;
    }
    getBotUsername() {
        return this.botUsername;
    }
    getBotInitLink() {
        if (!this.botUsername)
            return '';
        return `https://t.me/${this.botUsername}?start=init`;
    }
    async sendQueueNotification(params) {
        try {
            if (!this.isServiceEnabled()) {
                console.log('📱 Telegram service not available - skipping notification');
                return false;
            }
            const { chatId, username, telegramUsername, queuePattern, messageNumber = 1 } = params;
            const message = this.createQueueNotificationMessage(username, telegramUsername, queuePattern, messageNumber);
            await this.bot.sendMessage(chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: false,
                reply_markup: {
                    inline_keyboard: [[
                            {
                                text: '🚀 Join Queue NOW!',
                                url: 'https://app.prismax.ai/tele-op'
                            }
                        ]]
                }
            });
            console.log(`✅ Telegram notification ${messageNumber} sent to @${telegramUsername} (${chatId})`);
            return true;
        }
        catch (error) {
            console.error(`❌ Telegram notification failed to ${params.telegramUsername}:`, error.message);
            return false;
        }
    }
    createQueueNotificationMessage(username, telegramUsername, queuePattern, messageNumber) {
        const urgencyLevels = [
            { icon: '🔔', title: 'QUEUE NOTIFICATION', urgency: 'Your turn is coming up!' },
            { icon: '⚠️', title: 'URGENT ALERT', urgency: 'You are next in line!' },
            { icon: '🚨', title: 'CRITICAL ALERT', urgency: 'IT IS YOUR TURN NOW!' },
            { icon: '🔥', title: 'FINAL WARNING', urgency: 'JOIN IMMEDIATELY!' },
            { icon: '💀', title: 'LAST CHANCE', urgency: 'DO NOT MISS YOUR TURN!' }
        ];
        const level = urgencyLevels[Math.min(messageNumber - 1, urgencyLevels.length - 1)];
        return `${level.icon} <b>${level.title} #${messageNumber}</b>

${level.urgency}

👤 <b>Username:</b> ${username}
🎯 <b>Pattern:</b> <code>${queuePattern}</code>
📱 <b>Telegram:</b> @${telegramUsername}

⏰ <b>Time:</b> ${new Date().toLocaleTimeString()}

🔗 <b>Join now:</b> https://app.prismax.ai/tele-op

<i>This is notification ${messageNumber} of 5</i>`;
    }
    async sendSuccessiveNotifications(chatId, username, telegramUsername, queuePattern) {
        console.log(`📱 Starting successive Telegram notifications for @${telegramUsername}`);
        await this.sendQueueNotification({
            chatId,
            username,
            telegramUsername,
            queuePattern,
            messageNumber: 1
        });
        const intervals = [24000, 24000, 24000, 24000];
        for (let i = 0; i < intervals.length; i++) {
            setTimeout(async () => {
                await this.sendQueueNotification({
                    chatId,
                    username,
                    telegramUsername,
                    queuePattern,
                    messageNumber: i + 2
                });
            }, intervals.slice(0, i + 1).reduce((sum, interval) => sum + interval, 0));
        }
    }
    async findUserByChatId(chatId) {
        try {
            const result = await database_1.default.query('SELECT id, username, telegram_username FROM users WHERE telegram_chat_id = $1', [chatId]);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('Error finding user by chat ID:', error);
            return null;
        }
    }
    async linkChatIdToUser(telegramUsername, chatId) {
        try {
            const result = await database_1.default.query(`UPDATE users SET telegram_chat_id = $1 
         WHERE telegram_username = $2 
         RETURNING id, username`, [chatId, telegramUsername]);
            if (result.rows.length > 0) {
                console.log(`✅ Linked chat ID ${chatId} to @${telegramUsername}`);
                return true;
            }
            else {
                console.log(`❌ No user found with Telegram username @${telegramUsername}`);
                return false;
            }
        }
        catch (error) {
            console.error('Error linking chat ID to user:', error);
            return false;
        }
    }
    async testNotification(telegramUsername) {
        try {
            console.log(`🔍 Testing notification for Telegram username: ${telegramUsername}`);
            const result = await database_1.default.query('SELECT telegram_chat_id, username FROM users WHERE telegram_username = $1', [telegramUsername]);
            console.log(`📊 Database query returned ${result.rows.length} rows:`, result.rows);
            if (result.rows.length === 0) {
                console.log(`❌ No user found with Telegram username @${telegramUsername}`);
                return false;
            }
            const user = result.rows[0];
            console.log(`👤 Selected user:`, user);
            if (!user.telegram_chat_id) {
                console.log(`❌ User @${telegramUsername} hasn't initialized the bot yet`);
                return false;
            }
            console.log(`📱 Sending test notification to chat_id: ${user.telegram_chat_id}`);
            return await this.sendQueueNotification({
                chatId: user.telegram_chat_id,
                username: user.username,
                telegramUsername,
                queuePattern: 'test..123',
                messageNumber: 1
            });
        }
        catch (error) {
            console.error('Test notification failed:', error);
            return false;
        }
    }
    async sendWelcomeMessage(telegramUsername, chatId, username) {
        if (!this.isServiceEnabled()) {
            console.log('📱 Telegram service not available - skipping welcome message');
            return false;
        }
        try {
            const message = `🎯 <b>Welcome back to PrismaX AI Queue Notifications!</b>\n\n` +
                `✅ Your account is successfully linked!\n\n` +
                `👤 <b>Username:</b> ${username || 'User'}\n` +
                `📱 <b>Telegram:</b> @${telegramUsername}\n\n` +
                `🚨 You'll receive <b>5 urgent alerts</b> when it's your turn in the robotic arm queue.\n\n` +
                `🤖 Keep this chat active for instant notifications!\n\n` +
                `🔗 PrismaX AI: https://app.prismax.ai/tele-op`;
            await this.bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
            console.log(`✅ Welcome message sent to @${telegramUsername} (${chatId})`);
            return true;
        }
        catch (error) {
            console.error(`❌ Welcome message failed to @${telegramUsername}:`, error.message);
            return false;
        }
    }
    getServiceStatus() {
        return {
            enabled: this.isEnabled,
            botUsername: this.botUsername,
            initLink: this.getBotInitLink()
        };
    }
}
exports.telegramBotService = new TelegramBotService();
//# sourceMappingURL=telegramBotService.js.map