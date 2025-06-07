const User = require('../models/User');

exports.showRoulette = (req, res) => {
    // Rendert die neue EJS-Datei
    res.render('roulette', { 
        user: req.user,
    });
};

exports.placeBet = async (req, res) => {
    // Definieren der Roulette-Zahlen für Rot und Schwarz
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const blackNumbers = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

    try {
        const { amount, bet } = req.body; // 'bet' kann eine Zahl oder 'red'/'black' sein
        const user = await User.findById(req.user._id);
        const betAmount = parseInt(amount);

        // Wette validieren
        if (betAmount > user.balance) {
            return res.status(400).json({ success: false, error: 'Unzureichendes Guthaben' });
        }
        if (betAmount <= 0) {
            return res.status(400).json({ success: false, error: 'Ungültiger Einsatz' });
        }

        // Wette verarbeiten
        const winningNumber = Math.floor(Math.random() * 37);
        let win = false;
        let payout = 0;
        let message = '';

        // Überprüfen, ob auf eine Farbe oder eine Zahl gewettet wurde
        if (bet === 'red' || bet === 'black') {
            // Farbwette
            if (bet === 'red' && redNumbers.includes(winningNumber)) {
                win = true;
            } else if (bet === 'black' && blackNumbers.includes(winningNumber)) {
                win = true;
            }
            
            payout = win ? betAmount : -betAmount;
            message = win ? `Gewonnen! Die Zahl ist ${winningNumber}. Sie erhalten $${betAmount * 2}.` : `Verloren. Die Zahl ist ${winningNumber}. Sie verlieren $${betAmount}.`;

        } else if (!isNaN(parseInt(bet)) && parseInt(bet) >= 0 && parseInt(bet) <= 36) {
            // Zahlenwette
            const betNumber = parseInt(bet);
            win = betNumber === winningNumber;
            payout = win ? betAmount * 35 : -betAmount;
            message = win ? `Jackpot! Die Zahl ist ${winningNumber}. Sie haben $${betAmount * 36} gewonnen!` : `Verloren. Die Zahl ist ${winningNumber}. Sie verlieren $${betAmount}.`;
        } else {
            return res.status(400).json({ success: false, error: 'Ungültige Wette' });
        }

        // Kontostand aktualisieren
        user.balance += payout;
        await user.save();

        res.json({
            success: true,
            win,
            winningNumber,
            amount: betAmount,
            payout,
            newBalance: user.balance,
            message
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            error: 'Verarbeitung der Wette fehlgeschlagen'
        });
    }
};