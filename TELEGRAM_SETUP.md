# Telegram Bot Setup Guide

## 🤖 Creating Your Telegram Bot

### Step 1: Create Bot with BotFather

1. Open Telegram and search for `@BotFather`
2. Start a chat with BotFather and use the `/newbot` command
3. Follow the prompts:
   - **Bot Name**: `PrismaX AI Queue Bot` (display name)
   - **Bot Username**: `PrismaXBot` (must end with 'bot', must be unique)
4. BotFather will provide you with a **Bot Token** - save this securely!

### Step 2: Configure Bot Settings

Send these commands to BotFather:

```
/setdescription
PrismaX AI Queue Notification Bot - Get instant notifications when it's your turn to use the robotic arm!

/setabouttext  
Official bot for PrismaX AI queue notifications. Message this bot after registering to activate instant alerts.

/setcommands
start - Initialize bot and link your account
help - Show available commands
status - Check your notification status
```

### Step 3: Update Environment Variables

1. Copy your bot token from BotFather
2. Update `/server/.env`:

```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGhijKlmnoPQRstuvWXyz123456789
TELEGRAM_BOT_USERNAME=PrismaXBot
```

## 🚀 How It Works

### For Users:
1. **Register**: Add Telegram username (optional) when registering
2. **Activate**: Message `@Prismaxreminderbot` on Telegram with any message
3. **Receive**: Get 5 successive notifications over 2 minutes when it's their turn

### Bot Flow:
1. **User Registration**: User provides Telegram username during web registration
2. **Bot Activation**: User messages the bot → bot stores their `chat_id`
3. **Queue Detection**: Browser extension detects user's turn in queue
4. **Notifications**: Bot sends 5 messages over 2 minutes (every 24 seconds)

## 📱 Bot Commands

### `/start`
- Links user's Telegram account to their registration
- Requires user to be registered first with matching username
- Stores `chat_id` for future notifications

### Message Format for Notifications:

```
🚀 PrismaX AI is Ready!

Hey [Username]! Your turn has arrived!

📍 Queue Position: [Pattern]
⏰ Time: [Timestamp]
🔗 Access: https://app.prismax.ai/tele-op

This is message [X] of 5
```

## 🛠️ Technical Implementation

### Database Schema:
```sql
-- Users table includes:
telegram_username VARCHAR(255)  -- Username without @
telegram_chat_id BIGINT        -- For sending messages
```

### Key Files:
- **Backend**: `/server/src/services/telegramBotService.ts`
- **Queue Controller**: `/server/src/controllers/queueController.ts` 
- **Frontend**: `/client/src/components/ReminderForm.tsx`

### API Endpoints:
- `POST /api/users/register` - Now accepts `telegramUsername`
- `GET /api/users/telegram/status` - Check bot status
- `POST /api/users/test-telegram` - Test notifications (admin)

## 🔧 Development & Testing

### Start the Bot:
```bash
cd server
npm run dev
```

### Test Registration with Telegram:
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "test@example.com", 
    "telegramUsername": "testtelegram"
  }'
```

### Test Bot Activation:
1. Message your bot on Telegram
2. Check database: `telegram_chat_id` should be populated

### Test Notifications:
```bash
curl -X POST http://localhost:3001/api/users/test-telegram \
  -H "Content-Type: application/json" \
  -d '{"telegramUsername": "testtelegram"}'
```

## 🚦 Production Deployment

### Environment Setup:
1. Set production `TELEGRAM_BOT_TOKEN`
2. Configure webhook (optional, currently using polling)
3. Update `TELEGRAM_BOT_USERNAME` if different

### Security Considerations:
- Bot token is sensitive - never expose in frontend
- Validate user permissions before sending notifications
- Rate limit bot API calls
- Handle Telegram API errors gracefully

## 📊 Monitoring

### Logs to Watch:
- Bot initialization: `"🤖 Telegram Bot initialized"`
- User linking: `"✅ User linked successfully"`
- Notifications: `"📱 Starting successive Telegram notifications"`
- Errors: `"❌ Telegram bot error"`

### Database Queries:
```sql
-- Check Telegram registrations
SELECT username, telegram_username, telegram_chat_id 
FROM users 
WHERE telegram_username IS NOT NULL;

-- Check notification logs
SELECT * FROM notification_logs 
WHERE notification_method = 'telegram'
ORDER BY created_at DESC;
```

## 🤔 Troubleshooting

### Common Issues:

1. **Bot doesn't respond**:
   - Check `TELEGRAM_BOT_TOKEN` is correct
   - Verify bot is running (`npm run dev`)
   - Check console for error messages

2. **User can't link account**:
   - Ensure user registered with correct `telegram_username`
   - Username should match (without @ symbol)
   - Check database for existing registration

3. **Notifications not sending**:
   - Verify user has `telegram_chat_id` in database
   - Check if bot has permission to message user
   - Look for Telegram API rate limiting errors

4. **Database errors**:
   - Run migration: `psql -d reminder_app -f database/migrations/004_add_telegram_support.sql`
   - Check column exists: `\d users` in psql

### Debug Commands:
```bash
# Check bot status
curl http://localhost:3001/api/users/telegram/status

# Test specific user
curl -X POST http://localhost:3001/api/users/test-telegram \
  -H "Content-Type: application/json" \
  -d '{"telegramUsername": "your_username"}'
```

## 🎯 Success Criteria

- [ ] Bot responds to `/start` command
- [ ] User can register with Telegram username
- [ ] Bot links account when user messages it
- [ ] 5 successive notifications sent when queue turn arrives
- [ ] Email + Telegram notifications work together
- [ ] Frontend shows Telegram setup instructions
- [ ] Database properly stores Telegram data

## 📝 Next Steps

1. **Get Bot Token**: Follow Step 1 above
2. **Update .env**: Add your actual bot token
3. **Test Registration**: Use the registration form
4. **Activate Bot**: Message your bot on Telegram
5. **Test Queue**: Trigger a queue notification
6. **Monitor Logs**: Watch for successful message delivery

---

**Need Help?** Check the console logs and database for debugging information. The bot service logs all major events with emojis for easy identification.