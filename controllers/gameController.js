const User = require('../models/User');

exports.showGames = async (req, res) => {
    res.render('games', {
        user: req.user,
    });
};

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

// Zeigt die Blackjack-Seite an
exports.showBlackjack = (req, res) => {
    res.render('blackjack', { 
        user: req.user,
    });
};

// Hilfsfunktionen für das Spiel
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const createDeck = () => {
    const deck = [];
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
    return deck;
};

const shuffleDeck = (deck) => {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

const getCardValue = (card) => {
    if (['J', 'Q', 'K'].includes(card.value)) return 10;
    if (card.value === 'A') return 11;
    return parseInt(card.value);
};

const getHandValue = (hand) => {
    let value = 0;
    let aceCount = 0;
    for (const card of hand) {
        value += getCardValue(card);
        if (card.value === 'A') aceCount++;
    }
    while (value > 21 && aceCount > 0) {
        value -= 10;
        aceCount--;
    }
    return value;
};


// Startet ein neues Blackjack-Spiel
exports.startBlackjack = async (req, res) => {
    try {
        const { amount } = req.body;
        const betAmount = parseInt(amount);
        const user = await User.findById(req.user._id);

        if (betAmount > user.balance) {
            return res.status(400).json({ success: false, error: 'Unzureichendes Guthaben' });
        }
        if (betAmount <= 0) {
            return res.status(400).json({ success: false, error: 'Ungültiger Einsatz' });
        }

        user.balance -= betAmount;
        await user.save();

        const deck = shuffleDeck(createDeck());
        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];

        // Speichere den Spielzustand in der Session
        req.session.blackjack = {
            deck,
            playerHand,
            dealerHand,
            betAmount,
            gameOver: false
        };

        res.json({
            success: true,
            playerHand,
            dealerHand: [dealerHand[0]], // Zeige nur die erste Karte des Dealers
            playerValue: getHandValue(playerHand),
            dealerValue: getCardValue(dealerHand[0]),
            newBalance: user.balance,
            message: `Wette von $${betAmount} platziert. Dein Zug.`
        });

    } catch (err) {
        res.status(500).json({ success: false, error: 'Spiel konnte nicht gestartet werden.' });
    }
};

// Verarbeitet eine Spieleraktion (Hit oder Stand)
exports.playerAction = async (req, res) => {
    try {
        const { action } = req.body;
        const game = req.session.blackjack;
        const user = await User.findById(req.user._id);

        if (!game || game.gameOver) {
            return res.status(400).json({ success: false, error: 'Kein aktives Spiel gefunden.' });
        }

        let playerValue = getHandValue(game.playerHand);
        let dealerValue = getHandValue(game.dealerHand);
        let message = '';
        let payout = 0;

        if (action === 'hit') {
            game.playerHand.push(game.deck.pop());
            playerValue = getHandValue(game.playerHand);
            
            if (playerValue > 21) {
                game.gameOver = true;
                message = `Bust! Du hast verloren. Endwert: ${playerValue}.`;
                payout = 0; // Der Einsatz ist bereits abgezogen
            }
        }

        if (action === 'stand' || game.gameOver) {
            game.gameOver = true; // Spiel endet nach dem Stand oder Bust
            
            // Dealer zieht, bis er 17 oder mehr hat
            while (getHandValue(game.dealerHand) < 17) {
                game.dealerHand.push(game.deck.pop());
            }
            dealerValue = getHandValue(game.dealerHand);

            // Gewinner ermitteln, nur wenn der Spieler nicht schon "Bust" ist
            if (playerValue <= 21) {
                if (dealerValue > 21 || playerValue > dealerValue) {
                    message = `Gewonnen! Du: ${playerValue}, Dealer: ${dealerValue}.`;
                    payout = game.betAmount * 2; // Einsatz zurück + Gewinn
                } else if (playerValue < dealerValue) {
                    message = `Verloren. Du: ${playerValue}, Dealer: ${dealerValue}.`;
                    payout = 0;
                } else {
                    message = `Push (Unentschieden). Du: ${playerValue}, Dealer: ${dealerValue}.`;
                    payout = game.betAmount; // Einsatz zurück
                }
            }
            
            if (payout > 0) {
                user.balance += payout;
                await user.save();
            }
        }
        
        // Spielzustand in der Session aktualisieren
        req.session.blackjack = game;

        res.json({
            success: true,
            playerHand: game.playerHand,
            dealerHand: game.gameOver ? game.dealerHand : [game.dealerHand[0]],
            playerValue: getHandValue(game.playerHand),
            dealerValue: game.gameOver ? getHandValue(game.dealerHand) : getCardValue(game.dealerHand[0]),
            gameOver: game.gameOver,
            message,
            newBalance: user.balance
        });

    } catch (err) {
        res.status(500).json({ success: false, error: 'Aktion fehlgeschlagen.' });
    }
};

// Zeigt die Slot-Machine-Seite an
exports.showSlots = (req, res) => {
    res.render('slots', { 
        user: req.user,
    });
};

exports.playSlots = async (req, res) => {
    // Symbole und Auszahlungstabelle für 4-in-einer-Reihe
    const symbols = ['🍒', '🍋', '🍊', '🔔', '🍉', '⭐', '💎'];
    const payoutTable = {
        '🍒': 5,
        '🍋': 8,
        '🍊': 10,
        '🔔': 20,
        '🍉': 40,
        '⭐': 80,
        '💎': 150,
    };
    
    const numReels = 4;
    const numRows = 3;

    try {
        const { amount } = req.body;
        const betAmount = parseInt(amount);
        const user = await User.findById(req.user._id);

        if (betAmount > user.balance) {
            return res.status(400).json({ success: false, error: 'Unzureichendes Guthaben' });
        }
        if (betAmount <= 0) {
            return res.status(400).json({ success: false, error: 'Ungültiger Einsatz' });
        }

        user.balance -= betAmount;

        // Erzeuge ein 4x3 Raster von Symbolen
        const grid = [];
        for (let i = 0; i < numReels; i++) {
            const reel = [];
            for (let j = 0; j < numRows; j++) {
                reel.push(symbols[Math.floor(Math.random() * symbols.length)]);
            }
            grid.push(reel);
        }

        // Gewinnlinien prüfen (3 horizontale Linien)
        // Linien sind 0-indiziert (0=oben, 1=mitte, 2=unten)
        let totalPayout = 0;
        const winningLines = [];
        for (let row = 0; row < numRows; row++) {
            const line = [grid[0][row], grid[1][row], grid[2][row], grid[3][row]];
            const firstSymbol = line[0];
            const isWin = line.every(symbol => symbol === firstSymbol);
            
            if (isWin) {
                totalPayout += betAmount * payoutTable[firstSymbol];
                winningLines.push(row); // Speichere die gewinnende Reihe
            }
        }
        
        let win = totalPayout > 0;
        let message = win ? `Gewonnen! Du erhältst $${totalPayout}!` : 'Verloren. Versuch es erneut!';
        
        if (win) {
            user.balance += totalPayout;
        }

        await user.save();

        res.json({
            success: true,
            grid: grid, // Sende das gesamte Raster an den Client
            win,
            payout: totalPayout,
            winningLines, // Sende die Info, welche Linien gewonnen haben
            message,
            newBalance: user.balance
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Spin fehlgeschlagen.' });
    }
};