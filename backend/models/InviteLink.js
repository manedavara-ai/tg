  const mongoose = require("mongoose");

  const inviteLinkSchema = new mongoose.Schema({
    link: {
      type: String,
      required: true,
      unique: true
    },
    link_id: {
      type: String,
      required: false,
      unique: true
    },
    telegramUserId: { 
      type: String,
      required: false
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    is_used: { 
      type: Boolean, 
      default: false 
    },
    used_by: {
      type: String,
      default: null
    },
    used_at: {
      type: Date,
      default: null
    },
    expires_at: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      default: 86400 // 24 hours in seconds
    },
    created_at: { 
      type: Date, 
      default: Date.now 
    }
  }, {
    timestamps: true
  });

  // Index for better query performance
  inviteLinkSchema.index({ telegramUserId: 1, is_used: 1 });
  inviteLinkSchema.index({ expires_at: 1 });
  inviteLinkSchema.index({ created_at: -1 });

  module.exports = mongoose.model("InviteLink", inviteLinkSchema);
  