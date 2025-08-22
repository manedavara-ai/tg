const groupService = require('../services/groupService');
const cloudinaryService = require('../services/cloudinaryService');

// Create a new group
const createGroup = async (req, res) => {
  try {
    const groupData = {
      ...req.body,
      createdBy: req.admin.id // adminAuth middleware sets req.admin
    };

    // Handle image upload if provided
    if (req.body.image && req.body.image.startsWith('data:image')) {
      try {
        const uploadResult = await cloudinaryService.uploadImage(req.body.image);
        groupData.image = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        return res.status(400).json({ 
          message: 'Failed to upload image. Please try again.' 
        });
      }
    }

    const group = await groupService.createGroup(groupData);
    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all groups
const getAllGroups = async (req, res) => {
  try {
    const groups = await groupService.getAllGroups();
    res.json(groups);
  } catch (error) {
    console.error('Get all groups error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get group by ID
const getGroupById = async (req, res) => {
  try {
    const group = await groupService.getGroupById(req.params.id);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    res.json(group);
  } catch (error) {
    console.error('Get group by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update group
const updateGroup = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Handle image upload if provided
    if (req.body.image && req.body.image.startsWith('data:image')) {
      try {
        const uploadResult = await cloudinaryService.uploadImage(req.body.image);
        updateData.image = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError);
        return res.status(400).json({ 
          message: 'Failed to upload image. Please try again.' 
        });
      }
    }

    const updatedGroup = await groupService.updateGroup(req.params.id, updateData);
    res.json(updatedGroup);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete group
const deleteGroup = async (req, res) => {
  try {
    const result = await groupService.deleteGroup(req.params.id);
    res.json(result);
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Link group with Telegram
const linkTelegramGroup = async (req, res) => {
  try {
    const { chatId } = req.body;
    
    if (!chatId) {
      return res.status(400).json({ 
        message: 'Telegram chat ID is required' 
      });
    }

    const updatedGroup = await groupService.linkTelegramGroup(req.params.id, { chatId });
    res.json(updatedGroup);
  } catch (error) {
    console.error('Link Telegram group error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Test bot connection
const testBotConnection = async (req, res) => {
  try {
    const { chatId } = req.body;
    
    if (!chatId) {
      return res.status(400).json({ 
        message: 'Telegram chat ID is required' 
      });
    }

    const result = await groupService.testBotConnection(chatId);
    res.json(result);
  } catch (error) {
    console.error('Test bot connection error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get group statistics
const getGroupStats = async (req, res) => {
  try {
    const stats = await groupService.getGroupStats(req.params.id);
    res.json(stats);
  } catch (error) {
    console.error('Get group stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update group statistics
const updateGroupStats = async (req, res) => {
  try {
    const updatedGroup = await groupService.updateGroupStats(req.params.id, req.body);
    res.json(updatedGroup);
  } catch (error) {
    console.error('Update group stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Set group as default
const setDefaultGroup = async (req, res) => {
  try {
    const group = await groupService.setDefaultGroup(req.params.id);
    res.json(group);
  } catch (error) {
    console.error('Set default group error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get default group
const getDefaultGroup = async (req, res) => {
  try {
    const group = await groupService.getDefaultGroup();
    if (!group) {
      return res.status(404).json({ message: 'No default group found' });
    }
    res.json(group);
  } catch (error) {
    console.error('Get default group error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Search groups
const searchGroups = async (req, res) => {
  try {
    const { query, status, type } = req.query;
    
    let searchCriteria = {};
    
    if (query) {
      searchCriteria.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { telegramChatTitle: { $regex: query, $options: 'i' } }
      ];
    }
    
    if (status) {
      searchCriteria.status = status;
    }
    
    if (type) {
      searchCriteria.telegramChatType = type;
    }

    const groups = await groupService.searchGroups(searchCriteria);
    res.json(groups);
  } catch (error) {
    console.error('Search groups error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGroup,
  getAllGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  linkTelegramGroup,
  testBotConnection,
  getGroupStats,
  updateGroupStats,
  setDefaultGroup,
  getDefaultGroup,
  searchGroups
};
