const { validateInviteLink, revokeInviteLink } = require('../services/generateOneTimeInviteLink');
const User = require('../models/user.model');

// Webhook endpoint for Telegram bot to validate join requests
const validateJoinRequest = async (req, res) => {
  try {
    const { invite_link, telegram_user_id, user_info } = req.body;

    if (!invite_link || !telegram_user_id) {
      return res.status(400).json({ 
        error: 'Missing required fields: invite_link and telegram_user_id' 
      });
    }

    console.log(`🔍 Validating join request for Telegram user: ${telegram_user_id}`);
    console.log(`🔗 Invite link: ${invite_link}`);

    // Validate the invite link
    const validation = await validateInviteLink(invite_link, telegram_user_id);

    if (!validation.isValid) {
      console.log(`❌ Join request rejected for ${telegram_user_id}: ${validation.reason}`);
      return res.status(200).json({
        approve: false,
        reason: validation.reason
      });
    }

    // Create or update user record for test links
    let userId = validation.userId;
    
    if (!userId) {
      // This is a test link - create a temporary user record
      const User = require('../models/user.model');
      const testUser = new User({
        firstName: user_info.first_name || 'Test',
        lastName: user_info.last_name || 'User',
        email: `test_${telegram_user_id}@example.com`,
        phone: `test_${telegram_user_id}`,
        telegramUserId: telegram_user_id,
        telegramJoinStatus: 'joined',
        telegramJoinedAt: new Date()
      });
      
      await testUser.save();
      userId = testUser._id;
      console.log(`✅ Created test user ${userId} for Telegram ID: ${telegram_user_id}`);
      
      // Create a temporary payment record for expiry tracking
      const PaymentLink = require('../models/paymentLinkModel');
      const InviteLink = require('../models/InviteLink');
      
      // Get the invite link details for duration
      const linkDetails = await InviteLink.findOne({ link: invite_link });
      
      if (linkDetails && linkDetails.duration) {
        const expiryTime = new Date(Date.now() + (linkDetails.duration * 1000));
        
        const testPayment = new PaymentLink({
          userid: userId,
          link_id: `test_payment_${Date.now()}_${telegram_user_id}`,
          link_url: `test://payment/${telegram_user_id}`,
          customer_id: `test_customer_${telegram_user_id}`,
          phone: `test_${telegram_user_id}`,
          amount: 1, // Test amount
          plan_id: 'test_plan',
          plan_name: `Test Plan (${linkDetails.duration / 60} min)`,
          status: 'SUCCESS',
          purchase_datetime: new Date().toISOString(),
          expiry_date: expiryTime,
          duration: linkDetails.duration
        });
        
        await testPayment.save();
        console.log(`✅ Created test payment record - expires at: ${expiryTime.toLocaleString()}`);
      }
      
    } else {
      // Real user - update existing record
      await User.findByIdAndUpdate(userId, {
        telegramUserId: telegram_user_id,
        telegramJoinStatus: 'joined',
        telegramJoinedAt: new Date()
      });
      console.log(`✅ Updated user ${userId} with Telegram ID: ${telegram_user_id} and marked as joined`);
    }

    // Revoke the invite link to prevent reuse
    await revokeInviteLink(invite_link);

    console.log(`✅ Join request approved for ${telegram_user_id}`);
    return res.status(200).json({
      approve: true,
      user_id: validation.userId,
      link_id: validation.linkId
    });

  } catch (error) {
    console.error('Error validating join request:', error);
    return res.status(500).json({
      error: 'Internal server error during validation',
      approve: false
    });
  }
};

// Endpoint to check if a user should be kicked (for expiry checks)
const checkUserExpiry = async (req, res) => {
  try {
    const { telegram_user_id } = req.params;

    if (!telegram_user_id) {
      return res.status(400).json({ error: 'telegram_user_id is required' });
    }

    // Find user by telegram ID
    const user = await User.findOne({ telegramUserId: telegram_user_id });

    if (!user) {
      return res.status(404).json({ 
        shouldKick: true,
        reason: 'User not found in database'
      });
    }

    // Check if user has active subscription (this depends on your payment model)
    // For now, we'll assume if user exists, they're active
    // You might want to check against PaymentLink expiry or subscription status

    return res.status(200).json({
      shouldKick: false,
      user_id: user._id,
      email: user.email
    });

  } catch (error) {
    console.error('Error checking user expiry:', error);
    return res.status(500).json({
      error: 'Internal server error',
      shouldKick: true
    });
  }
};

// Endpoint to notify backend when user is kicked from Telegram
const notifyUserKicked = async (req, res) => {
  try {
    const { telegram_user_id, reason } = req.body;

    if (!telegram_user_id) {
      return res.status(400).json({ error: 'telegram_user_id is required' });
    }

    console.log(`📢 User ${telegram_user_id} was kicked from Telegram. Reason: ${reason || 'Not specified'}`);

    // You might want to log this or update user status
    // For example, mark user as inactive or log the kick event

    return res.status(200).json({
      success: true,
      message: 'Kick notification received'
    });

  } catch (error) {
    console.error('Error processing kick notification:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// Endpoint to store test invite links from bot
const storeTestLink = async (req, res) => {
  try {
    const { link, link_id, expires_at, duration } = req.body;

    if (!link || !expires_at) {
      return res.status(400).json({ error: 'Missing required fields: link, expires_at' });
    }

    console.log(`📝 Storing test invite link: ${link}`);

    const InviteLink = require('../models/InviteLink');
    
    const newLink = new InviteLink({
      link: link,
      link_id: link_id || `test_${Date.now()}`,
      telegramUserId: null,
      userId: null, // Test link
      is_used: false,
      expires_at: new Date(expires_at),
      duration: duration || 3600
    });

    await newLink.save();
    console.log(`✅ Test invite link stored with ID: ${newLink._id}`);

    return res.status(200).json({
      success: true,
      message: 'Test invite link stored successfully',
      link_id: newLink._id
    });

  } catch (error) {
    console.error('Error storing test invite link:', error);
    return res.status(500).json({
      error: 'Internal server error while storing test link'
    });
  }
};

module.exports = {
  validateJoinRequest,
  checkUserExpiry,
  notifyUserKicked,
  storeTestLink
};