const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

// Invite routes
router.get('/invites', ensureAuthenticated, inviteController.listInvites);
router.post('/invites/generate', ensureAuthenticated, inviteController.generateInvite);
router.post('/invites/buy', ensureAuthenticated, inviteController.buyInvite);

module.exports = router;
