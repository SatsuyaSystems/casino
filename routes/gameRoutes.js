const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const GameController = require('../controllers/gameController');

// Roulette game route
router.get('/roulette', ensureAuthenticated, GameController.showRoulette);
router.post('/roulette/bet', ensureAuthenticated, GameController.placeBet);

module.exports = router;
