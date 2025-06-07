const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const GameController = require('../controllers/gameController');

// Roulette game route

router.get('/games', ensureAuthenticated, GameController.showGames);
router.get('/roulette', ensureAuthenticated, GameController.showRoulette);
router.post('/roulette/bet', ensureAuthenticated, GameController.placeBet);

router.get('/blackjack', ensureAuthenticated, GameController.showBlackjack);
router.post('/blackjack/start', ensureAuthenticated, GameController.startBlackjack);
router.post('/blackjack/action', ensureAuthenticated, GameController.playerAction);

router.get('/slots', ensureAuthenticated, GameController.showSlots);
router.post('/slots/spin', ensureAuthenticated, GameController.playSlots);


module.exports = router;
