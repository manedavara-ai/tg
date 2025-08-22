// const Group = require('../models/group.model');
// const Plan = require('../models/plan');
// const { Telegraf } = require('telegraf');

// class GroupService {
//   constructor() {
//     this.bot = null;
//     if (process.env.BOT_TOKEN) {
//       this.bot = new Telegraf(process.env.BOT_TOKEN);
//     }
//   }

//   // Create a new group
//   async createGroup(groupData) {
//     try {
//       // If this is the first group, make it default
//       const existingGroups = await Group.countDocuments();
//       if (existingGroups === 0) {
//         groupData.isDefault = true;
//       }

//       const group = new Group(groupData);
//       await group.save();
//       return group;
//     } catch (error) {
//       throw new Error(`Failed to create group: ${error.message}`);
//     }
//   }

//   // Get all groups
//   async getAllGroups() {
//     try {
//       return await Group.find()
//         .populate('subscriptionPlans')
//         .populate('createdBy', 'email firstName lastName')
//         .sort({ createdAt: -1 });
//     } catch (error) {
//       throw new Error(`Failed to fetch groups: ${error.message}`);
//     }
//   }

//   // Get group by ID
//   async getGroupById(groupId) {
//     try {
//       return await Group.findById(groupId)
//         .populate('subscriptionPlans')
//         .populate('createdBy', 'email firstName lastName');
//     } catch (error) {
//       throw new Error(`Failed to fetch group: ${error.message}`);
//     }
//   }

//   // Update group
//   async updateGroup(groupId, updateData) {
//     try {
//       const group = await Group.findByIdAndUpdate(
//         groupId,
//         updateData,
//         { new: true, runValidators: true }
//       ).populate('subscriptionPlans');
      
//       if (!group) {
//         throw new Error('Group not found');
//       }
      
//       return group;
//     } catch (error) {
//       throw new Error(`Failed to update group: ${error.message}`);
//     }
//   }

//   // Delete group
//   async deleteGroup(groupId) {
//     try {
//       const group = await Group.findById(groupId);
//       if (!group) {
//         throw new Error('Group not found');
//       }

//       // Prevent deletion of default group
//       if (group.isDefault) {
//         throw new Error('Cannot delete default group');
//       }

//       await Group.findByIdAndDelete(groupId);
//       return { message: 'Group deleted successfully' };
//     } catch (error) {
//       throw new Error(`Failed to delete group: ${error.message}`);
//     }
//   }

//   // Link group with Telegram
//   async linkTelegramGroup(groupId, telegramData) {
//     try {
//       if (!this.bot) {
//         throw new Error('Telegram bot not configured');
//       }

//       const group = await Group.findById(groupId);
//       if (!group) {
//         throw new Error('Group not found');
//       }

//       // Verify bot is admin in the Telegram group/channel
//       try {
//         const chatMember = await this.bot.telegram.getChatMember(
//           telegramData.chatId,
//           this.bot.botInfo.id
//         );

//         if (!['administrator', 'creator'].includes(chatMember.status)) {
//           throw new Error('Bot is not admin in the specified group/channel');
//         }

//         // Get chat information
//         const chat = await this.bot.telegram.getChat(telegramData.chatId);
        
//         // Update group with Telegram information
//         const updatedGroup = await this.updateGroup(groupId, {
//           telegramChatId: telegramData.chatId,
//           telegramChatType: chat.type,
//           telegramChatTitle: chat.title,
//           botStatus: 'connected',
//           status: 'active',
//           linkedAt: new Date()
//         });

//         // Add group to Telegram Integration Service
//         const telegramService = require('./telegramIntegrationService');
//         await telegramService.addGroup(telegramData.chatId, {
//           groupId: groupId,
//           name: updatedGroup.name,
//           type: chat.type,
//           isDefault: updatedGroup.isDefault
//         });

//         return updatedGroup;
//       } catch (botError) {
//         // Update group with error status
//         await this.updateGroup(groupId, {
//           botStatus: 'error',
//           status: 'error'
//         });
//         throw new Error(`Bot verification failed: ${botError.message}`);
//       }
//     } catch (error) {
//       throw new Error(`Failed to link Telegram group: ${error.message}`);
//     }
//   }

//   // Test bot connection
//   async testBotConnection(chatId) {
//     try {
//       if (!this.bot) {
//         throw new Error('Telegram bot not configured');
//       }

//       const chatMember = await this.bot.telegram.getChatMember(chatId, this.bot.botInfo.id);
//       const chat = await this.bot.telegram.getChat(chatId);

//       return {
//         isAdmin: ['administrator', 'creator'].includes(chatMember.status),
//         chatType: chat.type,
//         chatTitle: chat.title,
//         botPermissions: chatMember.status
//       };
//     } catch (error) {
//       throw new Error(`Bot connection test failed: ${error.message}`);
//     }
//   }

//   // Get group statistics
//   async getGroupStats(groupId) {
//     try {
//       const group = await Group.findById(groupId);
//       if (!group) {
//         throw new Error('Group not found');
//       }

//       // Here you can add more complex statistics calculations
//       // For now, returning basic stats
//       return {
//         totalSubscribers: group.stats.totalSubscribers,
//         totalRevenue: group.stats.totalRevenue,
//         activeSubscriptions: group.stats.activeSubscriptions,
//         linkedAt: group.linkedAt,
//         botStatus: group.botStatus
//       };
//     } catch (error) {
//       throw new Error(`Failed to get group stats: ${error.message}`);
//     }
//   }

//   // Update group statistics
//   async updateGroupStats(groupId, statsData) {
//     try {
//       const group = await Group.findById(groupId);
//       if (!group) {
//         throw new Error('Group not found');
//       }

//       const updatedGroup = await this.updateGroup(groupId, {
//         'stats.totalSubscribers': statsData.totalSubscribers || group.stats.totalSubscribers,
//         'stats.totalRevenue': statsData.totalRevenue || group.stats.totalRevenue,
//         'stats.activeSubscriptions': statsData.activeSubscriptions || group.stats.activeSubscriptions
//       });

//       return updatedGroup;
//     } catch (error) {
//       throw new Error(`Failed to update group stats: ${error.message}`);
//     }
//   }

//   // Set group as default
//   async setDefaultGroup(groupId) {
//     try {
//       // Remove default from all other groups
//       await Group.updateMany(
//         { isDefault: true },
//         { isDefault: false }
//       );

//       // Set new default group
//       const group = await this.updateGroup(groupId, { isDefault: true });
//       return group;
//     } catch (error) {
//       throw new Error(`Failed to set default group: ${error.message}`);
//     }
//   }

//   // Get default group
//   async getDefaultGroup() {
//     try {
//       return await Group.findOne({ isDefault: true })
//         .populate('subscriptionPlans')
//         .populate('createdBy', 'email firstName lastName');
//     } catch (error) {
//       throw new Error(`Failed to get default group: ${error.message}`);
//     }
//   }

//   // Search groups
//   async searchGroups(searchCriteria) {
//     try {
//       return await Group.find(searchCriteria)
//         .populate('subscriptionPlans')
//         .populate('createdBy', 'email firstName lastName')
//         .sort({ createdAt: -1 });
//     } catch (error) {
//       throw new Error(`Failed to search groups: ${error.message}`);
//     }
//   }
// }

// module.exports = new GroupService();
 const Group = require('../models/group.model');
const Plan = require('../models/plan');
const { Telegraf } = require('telegraf');

class GroupService {
  constructor() {
    this.bot = null;
    if (process.env.BOT_TOKEN) {
      this.bot = new Telegraf(process.env.BOT_TOKEN);

      // bot.launch() નથી કરવાનું → 409 error નહિ આવે
      this.bot.telegram.getMe()
        .then(botInfo => {
          this.bot.botInfo = botInfo;
          console.log(`🤖 Bot loaded successfully: @${botInfo.username}`);
        })
        .catch(err => {
          console.error("❌ Failed to load bot info:", err.message);
        });
    }
  }

  // Create a new group
  async createGroup(groupData) {
    try {
      const existingGroups = await Group.countDocuments();
      if (existingGroups === 0) {
        groupData.isDefault = true;
      }
      const group = new Group(groupData);
      await group.save();
      return group;
    } catch (error) {
      throw new Error(`Failed to create group: ${error.message}`);
    }
  }

  // Get all groups
  async getAllGroups() {
    try {
      return await Group.find()
        .populate('subscriptionPlans')
        .populate('createdBy', 'email firstName lastName')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to fetch groups: ${error.message}`);
    }
  }

  // Get group by ID
  async getGroupById(groupId) {
    try {
      return await Group.findById(groupId)
        .populate('subscriptionPlans')
        .populate('createdBy', 'email firstName lastName');
    } catch (error) {
      throw new Error(`Failed to fetch group: ${error.message}`);
    }
  }

  // Update group
  async updateGroup(groupId, updateData) {
    try {
      const group = await Group.findByIdAndUpdate(
        groupId,
        updateData,
        { new: true, runValidators: true }
      ).populate('subscriptionPlans');

      if (!group) throw new Error('Group not found');
      return group;
    } catch (error) {
      throw new Error(`Failed to update group: ${error.message}`);
    }
  }

  // Delete group
  async deleteGroup(groupId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) throw new Error('Group not found');
      if (group.isDefault) throw new Error('Cannot delete default group');

      await Group.findByIdAndDelete(groupId);
      return { message: 'Group deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete group: ${error.message}`);
    }
  }

  // Link group with Telegram

  async linkTelegramGroup(groupId, { chatId }) {
    try {
      // ✅ Telegraf style
      const chat = await this.bot.telegram.getChat(chatId);
  
      if (!chat) {
        throw new Error("Bot verification failed: Chat not found");
      }
  
      // Save to DB
      const updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        {
          telegramChatId: chat.id,
          telegramChatTitle: chat.title,
          telegramChatType: chat.type,
          telegramInviteLink: chat.invite_link || null
        },
        { new: true }
      );
  
      return updatedGroup;
    } catch (err) {
      throw new Error(`Failed to link Telegram group: ${err.message}`);
    }
  }
  
  

// services/groupService.js

// Test bot connection
async testBotConnection(chatId) {
  try {
    if (!this.bot) {
      throw new Error('Telegram bot not configured');
    }

    // 🔹 Ensure chatId is cleaned
    const cleanChatId = String(chatId).trim();
    console.log("🔍 Testing bot connection with chatId:", cleanChatId);

    // Get bot info if not loaded yet
    if (!this.bot.botInfo) {
      await this.bot.telegram.getMe().then(info => {
        this.bot.botInfo = info;
        console.log("✅ Bot info loaded:", info.username);
      });
    }

    // Check if bot is member of chat
    const chatMember = await this.bot.telegram.getChatMember(
      cleanChatId,
      this.bot.botInfo.id
    );
    console.log("👤 ChatMember Response:", chatMember);

    // Get chat info
    const chat = await this.bot.telegram.getChat(cleanChatId);
    console.log("📢 Chat Info Response:", chat);

    if (!chat || !chat.id) {
      throw new Error("chat not found or inaccessible");
    }

    return {
      isAdmin: ['administrator', 'creator'].includes(chatMember.status),
      chatType: chat.type,
      chatTitle: chat.title,
      botPermissions: chatMember.status
    };
  } catch (error) {
    console.error("❌ Test bot connection error:", error.message);
    throw new Error(`Bot connection test failed: ${error.message}`);
  }
}

  

  // Get group statistics
  async getGroupStats(groupId) {
    try {
      const group = await Group.findById(groupId);
      if (!group) throw new Error('Group not found');

      return {
        totalSubscribers: group.stats.totalSubscribers,
        totalRevenue: group.stats.totalRevenue,
        activeSubscriptions: group.stats.activeSubscriptions,
        linkedAt: group.linkedAt,
        botStatus: group.botStatus
      };
    } catch (error) {
      throw new Error(`Failed to get group stats: ${error.message}`);
    }
  }

  // Update group statistics
  async updateGroupStats(groupId, statsData) {
    try {
      const group = await Group.findById(groupId);
      if (!group) throw new Error('Group not found');

      const updatedGroup = await this.updateGroup(groupId, {
        'stats.totalSubscribers': statsData.totalSubscribers || group.stats.totalSubscribers,
        'stats.totalRevenue': statsData.totalRevenue || group.stats.totalRevenue,
        'stats.activeSubscriptions': statsData.activeSubscriptions || group.stats.activeSubscriptions
      });

      return updatedGroup;
    } catch (error) {
      throw new Error(`Failed to update group stats: ${error.message}`);
    }
  }

  // Set group as default
  async setDefaultGroup(groupId) {
    try {
      await Group.updateMany({ isDefault: true }, { isDefault: false });
      return await this.updateGroup(groupId, { isDefault: true });
    } catch (error) {
      throw new Error(`Failed to set default group: ${error.message}`);
    }
  }

  // Get default group
  async getDefaultGroup() {
    try {
      return await Group.findOne({ isDefault: true })
        .populate('subscriptionPlans')
        .populate('createdBy', 'email firstName lastName');
    } catch (error) {
      throw new Error(`Failed to get default group: ${error.message}`);
    }
  }

  // Search groups
  async searchGroups(searchCriteria) {
    try {
      return await Group.find(searchCriteria)
        .populate('subscriptionPlans')
        .populate('createdBy', 'email firstName lastName')
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Failed to search groups: ${error.message}`);
    }
  }
}

module.exports = new GroupService();
