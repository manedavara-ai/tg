# 🎯 Telegram Payment Integration

A complete payment-to-Telegram channel access system with automatic subscription management.

## 🚀 Quick Start

### Prerequisites
- Node.js v16+
- Python 3.8+
- MongoDB (local or cloud)

### 1. Start Backend Server
```bash
cd backend
npm install
npm start
```
✅ Backend runs on: `http://localhost:4000`

### 2. Start Telegram Bot
```bash
cd "TG Bot Script"
pip install -r requirements.txt
python TG_Automation.py
```
✅ Bot should show: "Application started"

### 3. Test the System
```bash
node test-flow.js
```

## 🔧 Configuration

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://man:rL6LlQQ9QYjhQppV@cluster0.yxujymc.mongodb.net/tg
BOT_TOKEN=7567865431:AAGWHjzx3oAlQW7cLztreYHVNF7-7jEGp0c
CHANNEL_ID=-1002628965830
CASHFREE_CLIENT_ID=TEST10360225413b255427560253f37b52206301
CASHFREE_CLIENT_SECRET=cfsk_ma_test_676a34137ad0b6bcc88f11027052c253_2fb08a0e
```

### Bot (.env)
```env
BOT_TOKEN=7567865431:AAGWHjzx3oAlQW7cLztreYHVNF7-7jEGp0c
CHANNEL_ID=-1002628965830
ADMIN_USER_IDS=522249472
BACKEND_URL=http://localhost:4000
```

## 🔄 Complete Flow

### Customer Journey:
1. **Payment** → User completes payment via Cashfree
2. **Auto-Generate** → Backend creates one-time Telegram invite link
3. **Display** → Link shown on website + sent via email
4. **Join Request** → User clicks link → presses "Request to Join"
5. **Validation** → Bot validates with backend API
6. **Access** → Bot approves if valid, user joins channel
7. **Expiry** → When subscription expires, user is removed

### Admin Testing:
1. Message your bot `/start`
2. Use `/getlink` to generate test invite
3. Click link to test join process

## 📋 API Endpoints

### Backend (Port 4000)
- `GET /api/payment/test-config` - Test configuration
- `POST /api/telegram/validate-join` - Bot validation
- `GET /api/invite/user-invite/:userId` - Get user's invite link
- `POST /api/payment/webhook` - Payment webhook

### Testing URLs:
- Backend: http://localhost:4000/api/payment/test-config
- Health: http://localhost:4000/health

## 🔍 Monitoring

### Backend Logs (npm start):
- ✅ "Server running on port 4000"
- ✅ "MONGODB connected successfully"
- ✅ Payment webhook processing
- ✅ Invite link generation

### Bot Logs (python):
- ✅ "Application started"
- ✅ Join request processing
- ✅ Backend API validation
- ✅ User approval/decline

### Database Collections:
- `users` - User records with Telegram status
- `paymentlinks` - Payment records
- `invitelinks` - Telegram invite links

## 🚨 Troubleshooting

### Backend Won't Start:
- Check MongoDB connection in .env
- Verify BOT_TOKEN and CHANNEL_ID
- Ensure port 4000 is available

### Bot Won't Connect:
- Verify BOT_TOKEN is correct
- Check CHANNEL_ID format (-100...)
- Ensure bot is admin in channel
- Check BACKEND_URL in bot .env

### Join Requests Declined:
- Verify backend is running
- Check bot logs for validation errors
- Ensure invite link exists in database

## 🎯 Production Deployment

1. Update environment URLs (remove localhost)
2. Use production Cashfree credentials
3. Set up proper MongoDB cluster
4. Configure SSL/domains
5. Use process managers (PM2, systemd)

## 🔧 Development Commands

```bash
# Test backend config
curl http://localhost:4000/api/payment/test-config

# Test bot validation
curl -X POST http://localhost:4000/api/telegram/validate-join \
  -H "Content-Type: application/json" \
  -d '{"invite_link":"test","telegram_user_id":"123"}'

# View backend logs
cd backend && npm start

# View bot logs
cd "TG Bot Script" && python TG_Automation.py
```

---

## 🎉 Status: ✅ READY FOR TESTING

Your complete Telegram payment integration system is now configured and ready for testing with your actual credentials!