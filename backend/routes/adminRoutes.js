const express = require('express');
const router = express.Router();
const adminAuth = require('../middlewares/adminAuth');
const requireRole = require('../middlewares/roleMiddleware');
const adminController = require('../controllers/adminController');

// Public
router.post('/login', adminController.login);

// Authenticated admin routes
router.get('/me', adminAuth, adminController.getProfile);
router.get('/list', adminAuth, requireRole('superadmin'), adminController.listAdmins);
router.put('/:id/email', adminAuth, requireRole('superadmin'), adminController.updateAdminEmail);
router.put('/:id/password', adminAuth, requireRole('superadmin'), adminController.updateAdminPassword);
router.delete('/:id', adminAuth, requireRole('superadmin'), adminController.deleteAdmin);
router.post('/create-admin', adminAuth, requireRole('superadmin'), adminController.createAdmin);

module.exports = router;


