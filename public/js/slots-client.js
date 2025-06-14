document.addEventListener('DOMContentLoaded', () => {
    const balanceElem = document.getElementById('balance');
    const messageElem = document.getElementById('game-message');
    const spinBtn = document.getElementById('spin-btn');
    const betAmountInput = document.getElementById('bet-amount');
    
    const numReels = 5; // Angepasst
    const numRows = 3; // Angepasst
    const symbols = ['🍒', '🍋', '🍊', '🔔', '🍉', '⭐', '💎'];
    
    const cells = [];
    for (let i = 0; i < numReels; i++) {
        for (let j = 0; j < numRows; j++) {
            cells.push(document.getElementById(`cell-${i}-${j}`));
        }
    }

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
                for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
                    const cell = document.getElementById(`cell-${reelIndex}-${rowIndex}`);
                    if(cell) cell.innerText = symbols[Math.floor(Math.random() * symbols.length)];
                }

                if (Date.now() - startTime > animationDurationPerReel) {
                    clearInterval(interval);
                    for (let rowIndex = 0; rowIndex < numRows; rowIndex++) {
                        const cell = document.getElementById(`cell-${reelIndex}-${rowIndex}`);
                        if(cell) cell.innerText = finalGrid[reelIndex][rowIndex];
                    }
                }
            }, animationInterval);
        }
    };

    spinBtn.addEventListener('click', async () => {
        messageElem.innerText = 'Spinning...';
        
        const amount = betAmountInput.value;
        const response = await fetch('/slots/spin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
        const data = await response.json();

        if (data.success) {
            animateGrid(data.grid);

            const totalAnimationTime = 800;
            setTimeout(() => {
                messageElem.innerText = data.message;
                balanceElem.innerText = data.newBalance;

                if (data.win && data.winningLineDetails) {
                    // data.winningLineDetails is an array of winning lines.
                    // Each line is an array of coordinates, like [[0, 0], [1, 0], [2, 0]].
                    data.winningLineDetails.forEach(line => {
                        line.forEach(coord => {
                            const [col, row] = coord;
                            const cell = document.getElementById(`cell-${col}-${row}`);
                            if (cell) {
                                cell.classList.add('winning-cell');
                            }
                        });
                    });
                }

                spinBtn.disabled = false;
            }, totalAnimationTime);
        } else {
            messageElem.innerText = `Fehler: ${data.error}`;
            spinBtn.disabled = false;
        }
    });
});