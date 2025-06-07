document.addEventListener('DOMContentLoaded', () => {
    const balanceElem = document.getElementById('balance');
    const dealerHandElem = document.getElementById('dealer-hand');
    const playerHandElem = document.getElementById('player-hand');
    const dealerValueElem = document.getElementById('dealer-value');
    const playerValueElem = document.getElementById('player-value');
    const messageElem = document.getElementById('game-message');
    
    const betControls = document.getElementById('bet-controls');
    const gameControls = document.getElementById('game-controls');
    
    const startGameBtn = document.getElementById('start-game-btn');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');
    const betAmountInput = document.getElementById('bet-amount');

    // Hilfsfunktion zum Erstellen einer Karte
    const createCardElement = (card) => {
        const cardElem = document.createElement('div');
        cardElem.className = 'card';
        if (['hearts', 'diamonds'].includes(card.suit)) {
            cardElem.classList.add('red');
        }
        cardElem.textContent = card.value;
        return cardElem;
    };

    // UI basierend auf dem Spielzustand aktualisieren
    const updateUI = (data) => {
        balanceElem.textContent = data.newBalance;
        playerValueElem.textContent = data.playerValue || '';
        dealerValueElem.textContent = data.dealerValue || '';
        messageElem.textContent = data.message || '';
        
        playerHandElem.innerHTML = '';
        data.playerHand.forEach(card => playerHandElem.appendChild(createCardElement(card)));

        dealerHandElem.innerHTML = '';
        data.dealerHand.forEach(card => dealerHandElem.appendChild(createCardElement(card)));
        
        if (data.gameOver) {
            betControls.style.display = 'flex';
            gameControls.style.display = 'none';
        } else {
            betControls.style.display = 'none';
            gameControls.style.display = 'flex';
        }
    };

    // Event Listener für "Spiel starten"
    startGameBtn.addEventListener('click', async () => {
        const amount = betAmountInput.value;
        const response = await fetch('/blackjack/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();
        
        if (data.success) {
            updateUI(data);
        } else {
            messageElem.textContent = `Fehler: ${data.error}`;
        }
    });

    // Event Listener für "Hit"
    hitBtn.addEventListener('click', async () => {
        const response = await fetch('/blackjack/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'hit' })
        });
        const data = await response.json();
        if (data.success) {
            updateUI(data);
        }
    });
    
    // Event Listener für "Stand"
    standBtn.addEventListener('click', async () => {
        const response = await fetch('/blackjack/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'stand' })
        });
        const data = await response.json();
        if (data.success) {
            updateUI(data);
        }
    });
});