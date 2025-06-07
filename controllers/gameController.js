const User = require('../models/User');

exports.showRoulette = (req, res) => {
    res.render('roulette', { 
        user: req.user,
        balance: req.user.balance
    });
};

exports.placeBet = async (req, res) => {
    try {
        const { amount, number } = req.body;
        const user = await User.findById(req.user._id);

        // Validate bet
        if (amount > user.balance) {
            return res.status(400).json({ 
                error: 'Insufficient balance' 
            });
        }

        // Process bet
        const winningNumber = Math.floor(Math.random() * 37);
        const win = parseInt(number) === winningNumber;
        const payout = win ? amount * 35 : -amount;

        // Update user balance
        user.balance += payout;
        await user.save();

        res.json({
            success: true,
            win,
            winningNumber,
            amount,
            payout,
            newBalance: user.balance,
            message: win ? `You won $${amount * 35}!` : `You lost $${amount}`
        });
    } catch (err) {
        res.status(500).json({ 
            error: 'Bet processing failed' 
        });
    }
};
