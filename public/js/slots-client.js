document.addEventListener('DOMContentLoaded', () => {
    const balanceElem = document.getElementById('balance');
    const messageElem = document.getElementById('game-message');
    const spinBtn = document.getElementById('spin-btn');
    const betAmountInput = document.getElementById('bet-amount');
    
    const numReels = 4;
    const numRows = 3;
    const symbols = ['🍒', '🍋', '🍊', '🔔', '🍉', '⭐', '💎'];
    
    const cells = [];
    for (let i = 0; i < numReels; i++) {
        for (let j = 0; j < numRows; j++) {
            cells.push(document.getElementById(`cell-${i}-${j}`));
        }
    }

    // Funktion zum Zurücksetzen der Hervorhebung
    const clearHighlights = () => {
        cells.forEach(cell => cell.classList.remove('winning-cell'));
    };

    const animateGrid = (finalGrid) => {
        let animationInterval = 50;
        let animationDurationPerReel = 800;
        spinBtn.disabled = true;
        clearHighlights();

        for (let reelIndex = 0; reelIndex < numReels; reelIndex++) {
            const startTime = Date.now();
            let interval = setInterval(() => {
                // Animiere alle Zellen in der aktuellen Spalte
                for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
                    const cell = document.getElementById(`cell-${reelIndex}-${rowIndex}`);
                    cell.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                }

                // Stoppe die Animation für diese Spalte
                if (Date.now() - startTime > animationDurationPerReel) {
                    clearInterval(interval);
                    // Setze die finalen Symbole für diese Spalte
                    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
                        const cell = document.getElementById(`cell-${reelIndex}-${rowIndex}`);
                        cell.textContent = finalGrid[reelIndex][rowIndex];
                    }
                }
            }, animationInterval);
        }
    };

    spinBtn.addEventListener('click', async () => {
        messageElem.textContent = 'Spinning...';
        
        const amount = betAmountInput.value;
        const response = await fetch('/slots/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();

        if (data.success) {
            animateGrid(data.grid);

            // Warte, bis die Animation abgeschlossen ist, um die Ergebnisse anzuzeigen
            const totalAnimationTime = 800 * numReels + 200;
            setTimeout(() => {
                messageElem.textContent = data.message;
                balanceElem.textContent = data.newBalance;

                // Hebe die gewinnenden Linien hervor
                if (data.win && data.winningLines) {
                    data.winningLines.forEach(rowIndex => {
                        for (let reelIndex = 0; reelIndex < numReels; reelIndex++) {
                            document.getElementById(`cell-${reelIndex}-${rowIndex}`).classList.add('winning-cell');
                        }
                    });
                }

                spinBtn.disabled = false;
            }, totalAnimationTime);
        } else {
            messageElem.textContent = `Fehler: ${data.error}`;
            spinBtn.disabled = false;
        }
    });
});