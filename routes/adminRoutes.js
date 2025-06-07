// filepath: a:\Satsuya\SatsuyaCasino\routes\adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middleware/authMiddleware');

// All routes in this file will be protected by ensureAdmin
router.use(ensureAdmin);

router.get('/dashboard', adminController.showDashboard);
router.post('/users/balance', adminController.updateBalance);
router.get('/users/:userId/invite-tree', adminController.showUserInviteTree);

module.exports = router;