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
    const symbols = ['🍒', '🍋', '🍊', '🔔', '🍉', '⭐', '💎'];
    const numReels = 5;
    const numRows = 3;

    // Auszahlungstabelle für Cluster-Größen. Belohnt größere Gruppen.
    const payoutTable = {
        '🍒': { 5: 3, 6: 5, 7: 8, 8: 12, '9+': 20 },
        '🍋': { 5: 4, 6: 6, 7: 10, 8: 15, '9+': 25 },
        '🍊': { 5: 5, 6: 8, 7: 12, 8: 20, '9+': 35 },
        '🔔': { 5: 8, 6: 12, 7: 20, 8: 40, '9+': 75 },
        '🍉': { 5: 10, 6: 18, 7: 30, 8: 60, '9+': 120 },
        '⭐': { 5: 15, 6: 25, 7: 50, 8: 100, '9+': 200 },
        '💎': { 5: 25, 6: 50, 7: 100, 8: 200, '9+': 500 },
    };

    try {
        const { amount } = req.body;
        const betAmount = parseInt(amount);
        const user = await User.findById(req.user._id);

        if (betAmount > user.balance) {
            return res.status(400).json({ success: false, error: 'Unzureichendes Guthaben' });
        }
        user.balance -= betAmount;

        // Das 5x3 Raster mit zufälligen Symbolen füllen
        const grid = Array.from({ length: numReels }, () => 
            Array.from({ length: numRows }, () => symbols[Math.floor(Math.random() * symbols.length)])
        );

        let totalPayout = 0;
        const winningLineDetails = []; // Wir missbrauchen diese Variable, um Cluster-Koordinaten zu speichern
        const visited = Array.from({ length: numReels }, () => Array(numRows).fill(false));

        // Jede Zelle des Rasters durchgehen, um Cluster zu finden
        for (let col = 0; col < numReels; col++) {
            for (let row = 0; row < numRows; row++) {
                if (visited[col][row]) continue;

                const currentSymbol = grid[col][row];
                const cluster = [];
                const queue = [[col, row]]; // Startpunkt für die Suche
                visited[col][row] = true;
                
                let head = 0;
                while(head < queue.length) {
                    const [c, r] = queue[head++];
                    cluster.push([c, r]);
                    
                    // Prüfe alle 4 Nachbarn (oben, unten, links, rechts)
                    const neighbors = [[c, r - 1], [c, r + 1], [c - 1, r], [c + 1, r]];
                    for(const [nc, nr] of neighbors) {
                        if (
                            nc >= 0 && nc < numReels && nr >= 0 && nr < numRows && // Innerhalb des Rasters
                            !visited[nc][nr] && // Noch nicht besucht
                            grid[nc][nr] === currentSymbol // Gleiches Symbol
                        ) {
                            visited[nc][nr] = true;
                            queue.push([nc, nr]);
                        }
                    }
                }

                // Wenn der Cluster groß genug ist, berechne den Gewinn
                if (cluster.length >= 5) {
                    const payoutKey = cluster.length >= 9 ? '9+' : cluster.length.toString();
                    const payoutMultiplier = payoutTable[currentSymbol][payoutKey];
                    if (payoutMultiplier) {
                        totalPayout += betAmount * payoutMultiplier;
                        winningLineDetails.push(cluster);
                    }
                }
            }
        }
        
        let win = totalPayout > 0;
        let message = win ? `Cluster-Gewinn! Du erhältst $${totalPayout}!` : 'Verloren. Versuch es erneut!';
        
        if (win) {
            user.balance += totalPayout;
        }
        await user.save();

        res.json({
            success: true,
            grid,
            win,
            payout: totalPayout,
            winningLineDetails, // Sendet die Koordinaten aller Gewinn-Cluster
            message,
            newBalance: user.balance
        });

    } catch (err) {
        console.error("Slot Machine Error:", err);
        res.status(500).json({ success: false, error: 'Spin fehlgeschlagen.' });
    }
};