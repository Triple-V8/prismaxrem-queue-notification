# 🎯 PrismaX AI Queue Reminder System

A complete notification system for PrismaX AI robotic arm queue monitoring. Never miss your turn again!

## 🌟 Features

- **Real-time Queue Monitoring**: Browser extension monitors PrismaX AI queue automatically
- **Dual Notification Channels**: Email + Telegram instant notifications
- **Telegram Bot Integration**: 5 successive alerts over 2 minutes for urgent notifications
- **Username Pattern Conversion**: Converts usernames to secure abcd..xyz format
- **Web Dashboard**: Register with optional Telegram username
- **Robust Backend**: Express.js API with PostgreSQL and Telegram Bot API
- **Smart Retry Logic**: Handles connection failures gracefully across all channels

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Browser Ext.   │───▶│   Express API    │───▶│   PostgreSQL    │
│  (Queue Monitor) │    │   (Backend)      │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                        ┌───────┴───────┐
                        ▼               ▼
               ┌──────────────────┐ ┌──────────────────┐
               │   Email Service  │ │  Telegram Bot    │
               │   (Resend API)   │ │  (5x Alerts)     │
               └──────────────────┘ └──────────────────┘
                        │               │
                        └───────┬───────┘
                                ▼
                       ┌──────────────────┐
                       │   React Web App  │
                       │ (Registration)   │
                       └──────────────────┘
```

## 📁 Project Structure

```
reminder-app/
├── 📱 client/                  # React Frontend Dashboard
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ReminderForm.tsx
│   │   │   ├── QueueStatus.tsx
│   │   │   └── UserDashboard.tsx
│   │   ├── services/         # API integration
│   │   └── types/            # TypeScript definitions
│   └── package.json
├── 🔧 server/                 # Express.js Backend
│   ├── src/
│   │   ├── controllers/      # API controllers
│   │   │   ├── userController.ts
│   │   │   └── queueController.ts
│   │   ├── services/         # Business logic
│   │   │   ├── notificationService.ts
│   │   │   ├── telegramBotService.ts
│   │   │   └── validationService.ts
│   │   ├── routes/           # API routes
│   │   ├── config/           # Database & config
│   │   └── app.ts           # Express app
│   └── package.json
├── 🗄️ database/              # PostgreSQL Setup
│   ├── migrations/          # Database schema
│   └── seeds/              # Sample data
└── 🔌 browser-extension/     # Chrome Extension
    ├── manifest.json        # Extension config
    ├── content.js          # Queue monitoring
    ├── background.js       # Background tasks
    ├── popup.html          # Extension UI
    └── popup.js            # Popup logic
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm**
- **PostgreSQL** 12+
- **Google Chrome** (for extension)
- **Resend Account** (for email notifications)
- **Telegram Bot Token** (for instant notifications)

### 1️⃣ Telegram Bot Setup (Optional)

For instant Telegram notifications, create a bot:

```bash
# 1. Message @BotFather on Telegram
# 2. Use /newbot command
# 3. Choose name: "PrismaX AI Queue Bot"
# 4. Choose username: "PrismaXBot" (or your preference)
# 5. Save the bot token provided
```

See [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) for detailed instructions.

### 2️⃣ Database Setup

```bash
# Create PostgreSQL database
createdb reminder_app

# Run migrations
psql -d reminder_app -f database/migrations/001_initial_schema.sql

# Optional: Add sample data
psql -d reminder_app -f database/seeds/sample_data.sql
```

### 3️⃣ Backend Setup

```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and SMTP settings

# Start server
npm run dev
```

**Required .env configuration:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=reminder_app
DB_USER=postgres
DB_PASSWORD=your_password

# Email (Resend API)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=onboarding@resend.dev

# Telegram Bot (Optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_BOT_USERNAME=PrismaXBot

# Server
PORT=3001
NODE_ENV=development
```

### 4️⃣ Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will be available at: http://localhost:3000

### 5️⃣ Browser Extension Setup

1. **Open Chrome Extensions:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode"

2. **Load Extension:**
   - Click "Load unpacked"
   - Select the `browser-extension/` folder

3. **Verify Installation:**
   - Look for "PrismaX AI Queue Monitor" in your extensions
   - Pin it to your toolbar for easy access

## 📖 How It Works

### 🔐 User Registration Process

1. **User visits Dashboard** (http://localhost:3000)
2. **Enters PrismaX AI username** (e.g., "johndoesmith")
3. **System converts to pattern** → "john..ith" (first 4 + ".." + last 3)
4. **Stores in database** with email for notifications
5. **Sends welcome email** confirming registration

### 🔍 Queue Monitoring Process

1. **Extension monitors PrismaX AI** queue page automatically
2. **Extracts username patterns** from queue display (abcd..xyz format)
3. **Sends updates to backend** via API every 30 seconds
4. **Backend cross-checks** patterns against registered users
5. **Sends email notification** when match is found
6. **Marks user as notified** to prevent spam

### 📧 Notification System

**Welcome Email** (Registration):
- ✅ Confirms successful registration
- 📋 Shows username pattern that will be monitored
- 💡 Provides usage instructions

**Queue Notification** (Turn Alert):
- 🎯 "It's Your Turn!" subject line
- ⚡ Clear call-to-action to return to PrismaX AI
- 🔗 Direct link to PrismaX platform
- ⏰ Timestamp of notification

## 🔧 API Endpoints

### User Management

```bash
# Register new user
POST /api/users/register
{
  "username": "johndoesmith",
  "email": "john@example.com"
}

# Get all users
GET /api/users/all

# Find user by pattern
GET /api/users/pattern/john..ith

# Update notification status
PATCH /api/users/:id/notification-status
{
  "notified": true
}
```

### Queue Management

```bash
# Update queue status (from extension)
POST /api/queue/update
{
  "currentUserPattern": "john..ith",
  "rawContent": "Current user: john..ith",
  "timestamp": "2024-09-24T10:30:00Z"
}

# Get current queue status
GET /api/queue/current

# Get queue history
GET /api/queue/history?limit=50&offset=0

# Reset all notification flags
POST /api/queue/reset-notifications
```

### System Health

```bash
# Health check
GET /health
```

## 🎛️ Configuration Options

### Extension Configuration

**Monitoring Intervals:**
- Real-time monitoring: Every 30 seconds
- DOM change detection: 2 second debounce
- Failed request retry: Every 2 minutes

**Selectors (Auto-detected):**
```javascript
const possibleSelectors = [
  '.queue-current-user',
  '.current-user', 
  '.queue-status',
  '.next-user',
  '[data-testid="queue-current"]',
  '.user-turn',
  '.active-user'
];
```

### Email Templates

**Customize notification content** in:
- `server/src/services/notificationService.ts`

**Variables available:**
- `username` - Full PrismaX AI username
- `usernamePattern` - Converted pattern (abcd..xyz)  
- `email` - User's email address
- `timestamp` - Current time

## 🚨 Troubleshooting

### Common Issues

**❌ Extension not detecting queue:**
1. Check if you're on the correct PrismaX AI page
2. Open browser console (F12) and look for extension logs
3. Verify DOM selectors match the current page structure
4. Force check using extension popup

**❌ Email notifications not sending:**
1. Verify SMTP credentials in `.env`
2. Check Gmail "Less secure app access" or use App Passwords
3. Review server logs for email errors
4. Test SMTP connection: `npm run test-email`

**❌ Database connection errors:**
1. Ensure PostgreSQL is running
2. Verify database credentials in `.env`
3. Check database exists: `psql -l`
4. Test connection: `npm run test-db`

**❌ API not responding:**
1. Ensure backend server is running on port 3001
2. Check for port conflicts
3. Verify CORS settings for frontend domain
4. Check server logs for errors

### Debug Commands

```bash
# Backend logs
cd server && npm run dev

# Database query test
psql -d reminder_app -c "SELECT * FROM users;"

# Extension logs  
# Open Chrome DevTools on any PrismaX AI page
# Check Console tab for extension messages

# Email test
cd server && node -e "
const { NotificationService } = require('./src/services/notificationService');
const service = new NotificationService();
service.testConnection();
"
```

## 🔒 Security Considerations

- **Username Privacy**: Only stores pattern (abcd..xyz), not full username
- **Email Validation**: Proper input sanitization and validation
- **Rate Limiting**: API endpoints protected against abuse
- **HTTPS Required**: Production deployment should use SSL/TLS
- **Environment Variables**: Sensitive data stored in .env files

## 🚀 Production Deployment

### Backend Deployment

```bash
# Build TypeScript
npm run build

# Use PM2 for process management
npm install -g pm2
pm2 start dist/app.js --name "reminder-api"

# Or use Docker
docker build -t reminder-api .
docker run -p 3001:3001 reminder-api
```

### Database Deployment

```bash
# Production PostgreSQL setup
# Create production database
# Run migrations
# Set up regular backups
```

### Frontend Deployment

```bash
# Build React app
npm run build

# Deploy to static hosting (Netlify, Vercel, S3)
# Update API_URL to production backend
```

### Extension Distribution

1. **Chrome Web Store**: Package and submit extension
2. **Enterprise**: Use Chrome policy for organization-wide deployment
3. **Development**: Share unpacked extension folder

## 📊 Monitoring & Analytics

### Metrics to Track

- **User Registrations**: New users per day
- **Queue Updates**: API calls from extension
- **Notifications Sent**: Email delivery success rate
- **Extension Usage**: Active monitoring sessions

### Logging

**Backend logs include:**
- User registration events
- Queue status updates  
- Email notification attempts
- API request/response times
- Database query performance

**Extension logs include:**
- Queue detection success/failure
- API communication status
- DOM monitoring events
- User interaction tracking

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation
- Ensure proper error handling
- Test across different browsers

## 📜 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/prismax-reminder/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/prismax-reminder/discussions)
- **Email**: support@yourapp.com

---

**Made with ❤️ for the PrismaX AI community**

*Never miss your robotic arm session again!* 🤖✨