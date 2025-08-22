const axios = require("axios");
const InviteLink = require("../models/InviteLink");
require('dotenv').config();

// Use environment variables for bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID;

// Function to generate and store the invite link for join request flow
async function generateAndStoreInviteLink(userId, duration = 86400) {
  // Validate environment variables
  if (!BOT_TOKEN || !CHANNEL_ID) {
    throw new Error('BOT_TOKEN and CHANNEL_ID environment variables are required');
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/createChatInviteLink`;

  try {
    console.log(`Generating join request invite link for user: ${userId || 'anonymous'}`);
    
    // Make API request to Telegram to create the join request invite link
    const response = await axios.post(url, {
      chat_id: CHANNEL_ID,
      creates_join_request: true // This creates a join request that needs approval
    });

    console.log('Telegram API Response:', {
      status: response.status,
      chat_id: CHANNEL_ID,
      creates_join_request: true
    });

    // Extract invite link from the response
    const { invite_link } = response.data.result;

    console.log("✅ Join request invite link generated successfully:", invite_link);
    console.log("📋 Response data:", response.data.result);

    // Create a new InviteLink document to store in the database
    const newLink = new InviteLink({
      link: invite_link,
      link_id: `${invite_link.split('/').pop()}`, // Extract link identifier
      telegramUserId: null, // Will be set when user joins
      userId: userId, // Backend user ID
      is_used: false,
      expires_at: new Date(Date.now() + (duration * 1000)), // Convert seconds to milliseconds
      duration: duration
    });

    // Save the invite link to the database
    await newLink.save();
    console.log(`✅ Invite link saved to database with ID: ${newLink._id}`);

    // Return the saved link object
    return newLink;
  } catch (error) {
    // Handle Telegram API errors
    if (error.response?.data) {
      console.error("❌ Telegram API Error:", error.response.data);
      throw new Error(`Telegram API Error: ${error.response.data.description || error.response.data.error_code}`);
    }
    
    // Handle database errors
    if (error.name === 'ValidationError') {
      console.error("❌ Database Validation Error:", error.message);
      throw new Error(`Validation Error: ${error.message}`);
    }
    
    // Handle other errors
    console.error("❌ Error generating invite link:", error.message);
    throw new Error(`Failed to generate invite link: ${error.message}`);
  }
}

// Function to mark invite link as used
async function markInviteLinkAsUsed(linkId, telegramUserId) {
  try {
    const updatedLink = await InviteLink.findByIdAndUpdate(
      linkId,
      { 
        is_used: true,
        used_by: telegramUserId,
        used_at: new Date()
      },
      { new: true }
    );

    if (!updatedLink) {
      throw new Error('Invite link not found');
    }

    console.log(`✅ Invite link marked as used: ${linkId}`);
    return updatedLink;
  } catch (error) {
    console.error("❌ Error marking invite link as used:", error.message);
    throw error;
  }
}

// Function to get unused invite links for a user
async function getUnusedInviteLinks(telegramUserId) {
  try {
    const links = await InviteLink.find({
      telegramUserId: telegramUserId,
      is_used: false,
      expires_at: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    return links;
  } catch (error) {
    console.error("❌ Error fetching unused invite links:", error.message);
    throw error;
  }
}

// Function to clean up expired invite links
async function cleanupExpiredInviteLinks() {
  try {
    const result = await InviteLink.deleteMany({
      expires_at: { $lt: new Date() }
    });

    console.log(`🧹 Cleaned up ${result.deletedCount} expired invite links`);
    return result.deletedCount;
  } catch (error) {
    console.error("❌ Error cleaning up expired invite links:", error.message);
    throw error;
  }
}

// Function to validate invite link during join request
async function validateInviteLink(inviteLink, telegramUserId) {
  try {
    const linkRecord = await InviteLink.findOne({
      link: inviteLink,
      is_used: false,
      expires_at: { $gt: new Date() }
    }).populate('userId');

    if (!linkRecord) {
      console.log(`❌ Invalid or expired invite link: ${inviteLink}`);
      return { isValid: false, reason: 'Invalid or expired link' };
    }

    // Update the record with telegram user ID and mark as used
    linkRecord.telegramUserId = telegramUserId;
    linkRecord.is_used = true;
    linkRecord.used_by = telegramUserId;
    linkRecord.used_at = new Date();
    await linkRecord.save();

    console.log(`✅ Invite link validated for user ${telegramUserId}`);
    return { 
      isValid: true, 
      userId: linkRecord.userId,
      linkId: linkRecord._id
    };
  } catch (error) {
    console.error("❌ Error validating invite link:", error.message);
    return { isValid: false, reason: 'Server error during validation' };
  }
}

// Function to revoke invite link after use
async function revokeInviteLink(inviteLink) {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/revokeChatInviteLink`;
    
    await axios.post(url, {
      chat_id: CHANNEL_ID,
      invite_link: inviteLink
    });

    console.log(`✅ Invite link revoked: ${inviteLink}`);
  } catch (error) {
    console.error("❌ Error revoking invite link:", error.message);
  }
}

// Function to get invite link for a specific user
async function getUserInviteLink(userId) {
  try {
    const linkRecord = await InviteLink.findOne({
      userId: userId,
      is_used: false,
      expires_at: { $gt: new Date() }
    }).sort({ createdAt: -1 });

    return linkRecord;
  } catch (error) {
    console.error("❌ Error fetching user invite link:", error.message);
    throw error;
  }
}

module.exports = { 
  generateAndStoreInviteLink,
  markInviteLinkAsUsed,
  getUnusedInviteLinks,
  cleanupExpiredInviteLinks,
  validateInviteLink,
  revokeInviteLink,
  getUserInviteLink
};