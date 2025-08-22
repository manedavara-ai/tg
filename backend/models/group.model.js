const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String // URL to stored image
  },
  telegramChatId: {
    type: String, // Telegram chat ID (group/channel ID)
    unique: true,
    sparse: true
  },
  telegramChatType: {
    type: String,
    enum: ['group', 'channel', 'supergroup'],
    // required: true
    default: 'channel'
  },
  telegramChatTitle: {
    type: String
  },
  botStatus: {
    type: String,
    enum: ['not_connected', 'connected', 'error'],
    default: 'not_connected'
  },
  botUsername: {
    type: String,
    default: 'Rigi_Robot'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'error'],
    default: 'pending'
  },
  subscriptionPlans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  }],
  addGST: {
    type: Boolean,
    default: false
  },
  faqs: [{
    question: String,
    answer: String
  }],
  linkedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    // required: true  
  },
  stats: {
    totalSubscribers: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    activeSubscriptions: {
      type: Number,
      default: 0
    }
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
groupSchema.index({ telegramChatId: 1 });
groupSchema.index({ status: 1 });
groupSchema.index({ createdBy: 1 });
groupSchema.index({ isDefault: 1 });

module.exports = mongoose.model('Group', groupSchema);