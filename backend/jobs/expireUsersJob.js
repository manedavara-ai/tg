const mongoose = require('mongoose');
const axios = require('axios');
const PaymentLink = require('../models/paymentLinkModel');
const User = require('../models/user.model');
const cron = require('node-cron');

// === Telegram Bot Details ===
require('dotenv').config();
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHANNEL_ID;
const REJOIN_LINK = 'https://t.me/YOUR_GROUP_LINK_OR_USERNAME';

const removeUserFromTelegram = async (userId, userRecord) => {
  try {
    // For channels, we need to use banChatMember instead of kickChatMember
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/banChatMember`, {
      chat_id: CHAT_ID,
      user_id: userId
    });
    console.log(`Banned user ${userId} from Telegram channel`);

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 4000));

    // Unban to allow future rejoining
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/unbanChatMember`, {
      chat_id: CHAT_ID,
      user_id: userId
    });
    console.log(`Unbanned user ${userId} from Telegram channel`);

    // Update user status to 'expired'
    if (userRecord) {
      await User.findByIdAndUpdate(userRecord._id, {
        telegramJoinStatus: 'expired'
      });
      console.log(`Updated user ${userRecord._id} status to expired`);
    }

    // Optional: Send expiry notification (comment out if not needed)
    // await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    //   chat_id: userId,
    //   text: `Your subscription has expired. You have been removed from the channel. Please renew your subscription to rejoin.`
    // });

  } catch (error) {
    console.error(`Telegram bot error for ${userId}:`, error.response?.data || error.message);
  }
};

const checkExpiredUsers = async () => {
  console.log('Running user cleanup + Telegram kick job');

  try {
    const now = new Date();

    const expiredPayments = await PaymentLink.find({
      expiry_date: { $lt: now },
    });

    for (const payment of expiredPayments) {
      const dbUserId = payment.userid;

      // Find user record before deletion to preserve Telegram info
      const userRecord = await User.findById(dbUserId);
      const telegramUserId = userRecord?.telegramUserId || null;

      console.log(`Processing expired payment for user ${dbUserId} (${userRecord?.email || 'no email'})`);

      // Remove from Telegram first if they have a Telegram ID and are currently joined
      if (telegramUserId && userRecord?.telegramJoinStatus === 'joined') {
        await removeUserFromTelegram(telegramUserId, userRecord);
      } else if (!telegramUserId) {
        console.warn(`No Telegram ID found for user ${dbUserId}`);
      } else {
        console.log(`User ${dbUserId} not currently joined to Telegram (status: ${userRecord?.telegramJoinStatus})`);
      }

      // Clean up database records
      await User.findByIdAndDelete(dbUserId);
      await PaymentLink.findByIdAndDelete(payment._id);
      console.log(`Deleted DB user ${dbUserId} and payment record`);
    }

    console.log(`Cleanup done at ${now.toISOString()}`);
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
};

// Initial run - only if MONGODB is connected
if (mongoose.connection.readyState === 1) {
  checkExpiredUsers();
} else {
  console.log('MONGODB not connected, skipping initial cleanup run');
}

// Run every minute for testing (change to '0 2 * * *' for production - daily at 2 AM)
cron.schedule('* * * * *', checkExpiredUsers);

console.log('⏰ Expiry job scheduled to run every minute for testing');
console.log('📋 Change to "0 2 * * *" for production (daily at 2 AM)');

module.exports = { checkExpiredUsers };