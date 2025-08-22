const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const adminAuth = require('../middlewares/adminAuth');

// Apply admin authentication middleware to all routes
router.use(adminAuth);

// Group CRUD operations
router.post('/create', groupController.createGroup);
router.get('/all', groupController.getAllGroups);
router.get('/:id', groupController.getGroupById);
router.put('/:id', groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);

// Telegram integration
router.post('/:id/link-telegram', groupController.linkTelegramGroup);
router.post('/:id/test-connection', groupController.testBotConnection);

// Group management
router.get('/:id/stats', groupController.getGroupStats);
router.put('/:id/stats', groupController.updateGroupStats);
router.post('/:id/set-default', groupController.setDefaultGroup);
router.get('/default', groupController.getDefaultGroup);

// Search and filtering
router.get('/search', groupController.searchGroups);

module.exports = router;
