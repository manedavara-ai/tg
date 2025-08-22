const express = require('express');
const router = express.Router();
const {
  validateJoinRequest,
  checkUserExpiry,
  notifyUserKicked,
  storeTestLink
} = require('../controllers/telegramController');

// Webhook endpoint for Telegram bot to validate join requests
// POST /api/telegram/validate-join
router.post('/validate-join', validateJoinRequest);

// Endpoint to check if a user should be kicked from Telegram
// GET /api/telegram/check-expiry/:telegram_user_id
router.get('/check-expiry/:telegram_user_id', checkUserExpiry);

// Endpoint for Telegram bot to notify when user is kicked
// POST /api/telegram/notify-kick
router.post('/notify-kick', notifyUserKicked);

// Endpoint for bot to store test invite links
// POST /api/telegram/store-test-link
router.post('/store-test-link', storeTestLink);

module.exports = router;