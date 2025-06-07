document.addEventListener('DOMContentLoaded', () => {
    const balanceElem = document.getElementById('balance');
    const messageElem = document.getElementById('game-message');
    const spinBtn = document.getElementById('spin-btn');
    const betAmountInput = document.getElementById('bet-amount');
    const reels = [
        document.getElementById('reel1'),
        document.getElementById('reel2'),
        document.getElementById('reel3')
    ];
    
    const symbols = ['🍒', '🍋', '🍊', '🔔', '🍉', '⭐', '💎'];

    // Funktion für eine einfache visuelle Animation
    const animateReels = (finalReels) => {
        let animationInterval = 50; // ms
        let animationDuration = 1000; // 1 Sekunde pro Walze
        
        reels.forEach((reel, index) => {
            const startTime = Date.now();
            let interval = setInterval(() => {
                // Zufälliges Symbol anzeigen
                reel.textContent = symbols[Math.floor(Math.random() * symbols.length)];

                // Animation nach der Dauer stoppen
                if (Date.now() - startTime > animationDuration * (index + 1)) {
                    clearInterval(interval);
                    reel.textContent = finalReels[index]; // Endgültiges Symbol anzeigen

                    // Nach der letzten Walze das Ergebnis auswerten
                    if (index === reels.length - 1) {
                         spinBtn.disabled = false; // Button wieder aktivieren
                    }
                }
            }, animationInterval);
        });
    };

    spinBtn.addEventListener('click', async () => {
        spinBtn.disabled = true;
        messageElem.textContent = 'Spinning...';
        
        const amount = betAmountInput.value;
        const response = await fetch('/slots/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();

        if (data.success) {
            animateReels(data.reels);
            // Die UI-Nachricht wird nach der Animation aktualisiert
            setTimeout(() => {
                messageElem.textContent = data.message;
                balanceElem.textContent = data.newBalance;
            }, 1000 * reels.length + 500); // Warte, bis die Animation fertig ist
        } else {
            messageElem.textContent = `Fehler: ${data.error}`;
            spinBtn.disabled = false;
        }
    });
});