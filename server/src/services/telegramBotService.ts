import TelegramBot from 'node-telegram-bot-api';
import pool from '../config/database';

interface TelegramNotificationParams {
  chatId: number;
  username: string;
  telegramUsername: string;
  queuePattern: string;
  messageNumber?: number;
}

class TelegramBotService {
  private bot: TelegramBot | null = null;
  private isEnabled: boolean = false;
  private botUsername: string = '';

  constructor() {
    this.initializeBot();
  }

  private async initializeBot() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.warn('⚠️ Telegram bot token not found. Telegram notifications disabled.');
      console.log('💡 To enable Telegram: Set TELEGRAM_BOT_TOKEN in .env file');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      
      // Get bot info
      const botInfo = await this.bot.getMe();
      this.botUsername = botInfo.username || 'PrismaXBot';
      this.isEnabled = true;
      
      console.log(`✅ Telegram bot initialized: @${this.botUsername}`);
      
      // Set up message handlers
      this.setupMessageHandlers();
      
    } catch (error) {
      console.error('❌ Failed to initialize Telegram bot:', error);
      this.isEnabled = false;
    }
  }

  private setupMessageHandlers() {
    if (!this.bot) return;

    // Handle /start command
    this.bot.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const username = msg.from?.username;
      
      console.log(`📱 Telegram /start received from chat ${chatId}, username: ${username}`);

      try {
        // Store or update chat ID for this username
        if (username) {
          await pool.query(
            `UPDATE users SET telegram_chat_id = $1 
             WHERE telegram_username = $2 AND telegram_chat_id IS NULL`,
            [chatId, username]
          );
          
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

        await this.bot!.sendMessage(chatId, welcomeMessage, { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        });

      } catch (error) {
        console.error('Error handling /start command:', error);
        
        const errorMessage = `❌ There was an error linking your Telegram account. Please make sure you're registered on the PrismaX AI website with this Telegram username (@${username}).`;
        
        await this.bot!.sendMessage(chatId, errorMessage);
      }
    });

    // Handle other messages
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

        await this.bot!.sendMessage(chatId, helpMessage, { 
          parse_mode: 'Markdown',
          disable_web_page_preview: true 
        });
      }
    });
  }

  isServiceEnabled(): boolean {
    return this.isEnabled && this.bot !== null;
  }

  getBotUsername(): string {
    return this.botUsername;
  }

  getBotInitLink(): string {
    if (!this.botUsername) return '';
    return `https://t.me/${this.botUsername}?start=init`;
  }

  async sendQueueNotification(params: TelegramNotificationParams): Promise<boolean> {
    try {
      if (!this.isServiceEnabled()) {
        console.log('📱 Telegram service not available - skipping notification');
        return false;
      }

      const { chatId, username, telegramUsername, queuePattern, messageNumber = 1 } = params;

      const message = this.createQueueNotificationMessage(username, telegramUsername, queuePattern, messageNumber);
      
      await this.bot!.sendMessage(chatId, message, {
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

    } catch (error: any) {
      console.error(`❌ Telegram notification failed to ${params.telegramUsername}:`, error.message);
      return false;
    }
  }

  private createQueueNotificationMessage(username: string, telegramUsername: string, queuePattern: string, messageNumber: number): string {
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

  async sendSuccessiveNotifications(
    chatId: number, 
    username: string, 
    telegramUsername: string, 
    queuePattern: string
  ): Promise<void> {
    console.log(`📱 Starting successive Telegram notifications for @${telegramUsername}`);
    
    // Send immediate notification
    await this.sendQueueNotification({
      chatId,
      username,
      telegramUsername,
      queuePattern,
      messageNumber: 1
    });

    // Schedule 4 more notifications over 2 minutes (24, 48, 72, 96 seconds)
    const intervals = [24000, 24000, 24000, 24000]; // 24 second intervals
    
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

  async findUserByChatId(chatId: number): Promise<any | null> {
    try {
      const result = await pool.query(
        'SELECT id, username, telegram_username FROM users WHERE telegram_chat_id = $1',
        [chatId]
      );
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error finding user by chat ID:', error);
      return null;
    }
  }

  async linkChatIdToUser(telegramUsername: string, chatId: number): Promise<boolean> {
    try {
      const result = await pool.query(
        `UPDATE users SET telegram_chat_id = $1 
         WHERE telegram_username = $2 
         RETURNING id, username`,
        [chatId, telegramUsername]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Linked chat ID ${chatId} to @${telegramUsername}`);
        return true;
      } else {
        console.log(`❌ No user found with Telegram username @${telegramUsername}`);
        return false;
      }
    } catch (error) {
      console.error('Error linking chat ID to user:', error);
      return false;
    }
  }

  async testNotification(telegramUsername: string): Promise<boolean> {
    try {
      console.log(`🔍 Testing notification for Telegram username: ${telegramUsername}`);
      
      const result = await pool.query(
        'SELECT telegram_chat_id, username FROM users WHERE telegram_username = $1',
        [telegramUsername]
      );

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
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }

  async sendWelcomeMessage(telegramUsername: string, chatId: number, username?: string): Promise<boolean> {
    if (!this.isServiceEnabled()) {
      console.log('📱 Telegram service not available - skipping welcome message');
      return false;
    }

    try {
      const message = 
        `🎯 <b>Welcome back to PrismaX AI Queue Notifications!</b>\n\n` +
        `✅ Your account is successfully linked!\n\n` +
        `👤 <b>Username:</b> ${username || 'User'}\n` +
        `📱 <b>Telegram:</b> @${telegramUsername}\n\n` +
        `🚨 You'll receive <b>5 urgent alerts</b> when it's your turn in the robotic arm queue.\n\n` +
        `🤖 Keep this chat active for instant notifications!\n\n` +
        `🔗 PrismaX AI: https://app.prismax.ai/tele-op`;

      await this.bot!.sendMessage(chatId, message, { parse_mode: 'HTML' });
      
      console.log(`✅ Welcome message sent to @${telegramUsername} (${chatId})`);
      return true;

    } catch (error: any) {
      console.error(`❌ Welcome message failed to @${telegramUsername}:`, error.message);
      return false;
    }
  }

  async sendPositionNotifications(
    chatId: number, 
    username: string, 
    telegramUsername: string, 
    queuePattern: string,
    position: number
  ): Promise<void> {
    console.log(`📱 Sending position ${position} Telegram notifications for @${telegramUsername}`);
    
    const isNext = position === 1;
    const positionOrdinal = this.getOrdinalNumber(position);
    
    if (isNext) {
      // If it's their turn (position 1), send successive urgent notifications
      await this.sendSuccessiveNotifications(chatId, username, telegramUsername, queuePattern);
    } else {
      // Send a single position update notification
      const message = this.createPositionUpdateMessage(username, telegramUsername, queuePattern, position, positionOrdinal);
      
      await this.bot!.sendMessage(chatId, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: {
          inline_keyboard: [[
            {
              text: '👀 View Queue Status',
              url: 'https://app.prismax.ai/tele-op'
            }
          ]]
        }
      });

      console.log(`✅ Position ${position} notification sent to @${telegramUsername} (${chatId})`);
    }
  }

  private createPositionUpdateMessage(username: string, telegramUsername: string, queuePattern: string, position: number, positionOrdinal: string): string {
    const positionEmojis = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    const positionIcon = positionEmojis[position - 1] || '🔢';

    return `${positionIcon} <b>QUEUE POSITION UPDATE</b>

🏁 You are <b>${positionOrdinal}</b> in the queue!

👤 <b>Username:</b> ${username}
🎯 <b>Pattern:</b> <code>${queuePattern}</code>
📱 <b>Telegram:</b> @${telegramUsername}
📍 <b>Position:</b> ${positionOrdinal}

⏰ <b>Time:</b> ${new Date().toLocaleTimeString()}

${position <= 3 ? 
  '🔥 <b>You\'re getting close! Stay ready!</b>' : 
  'ℹ️ Keep an eye on your position - you\'ll get urgent alerts when it\'s your turn.'
}

🔗 <b>View queue:</b> https://app.prismax.ai/tele-op`;
  }

  private getOrdinalNumber(num: number): string {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  getServiceStatus(): { enabled: boolean; botUsername: string; initLink: string } {
    return {
      enabled: this.isEnabled,
      botUsername: this.botUsername,
      initLink: this.getBotInitLink()
    };
  }
}

export const telegramBotService = new TelegramBotService();