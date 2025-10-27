document.addEventListener("DOMContentLoaded", () => {
    
    // /---------------- BOARD SECTION -------------------\
    // creates values to store references to html elements
    const board = document.getElementById("board");
    const colsInput = document.getElementById("cols");
    const resetBtn = document.getElementById("resetBtn");

    // function to generate initial board
    function generate_board(colunas = 9, linhas = 4) {
        board.innerHTML = ""; // clears board
        // defines the layout of the board as a grid
        board.style.gridTemplateColumns = `repeat(${colunas}, 56px)`;
        board.style.gridTemplateRows = `repeat(${linhas}, 56px)`;

        // runs through the board
        for (let linha = 0; linha < linhas; linha++) {
            for (let coluna = 0; coluna < colunas; coluna++) {
                const cell = document.createElement("div"); // creates element div -\
                cell.classList.add("cell"); // and assigns it the css class cell <--/

                // fills board with pieces
                if (linha === 0) {
                    const piece = document.createElement("div");
                    piece.classList.add("piece", "red");
                    piece.draggable = true; // adds property to dragg
                    cell.appendChild(piece); // adds piece to the cell (the board spot)
                } else if (linha === linhas - 1) {
                    const piece = document.createElement("div");
                    piece.classList.add("piece", "blue");
                    piece.draggable = true; // adds property to drag
                    cell.appendChild(piece); // adds piece to the cell (the board spot)
                }

                // drop and drag events
                cell.addEventListener("dragover", (e) => {
                    e.preventDefault(); // allows the drop
                });

                cell.addEventListener("drop", (e) => {
                    e.preventDefault();
                    const dragged = document.querySelector(".dragging");
                    if (dragged) {
                        // allows to "destroy" a piece
                        const existing = cell.querySelector(".piece");
                        if (existing) existing.remove();
                        cell.appendChild(dragged);
                    }
                });

                board.appendChild(cell);
            }
        }

        // adds dragging
        const pieces = board.querySelectorAll(".piece");
        pieces.forEach((piece) => {
            piece.addEventListener("dragstart", () => {
                piece.classList.add("dragging");
            });
            piece.addEventListener("dragend", () => {
                piece.classList.remove("dragging");
            });
        });
    }

    // generates initial board
    generate_board();

    // Atualiza quando o valor mudar
    colsInput.addEventListener("input", (e) => {
        let colunas = parseInt(e.target.value) || 9;

        // makes sure of odd number
        if (colunas % 2 === 0) {
            colunas = colunas + 1; // adjusts
            e.target.value = colunas; // updates input
        }

        // makes sure its between limits
        if (colunas < 7) colunas = 7;
        if (colunas > 15) colunas = 15;

        generate_board(colunas);
    });

    // reset button
    resetBtn.addEventListener("click", () => {
        const colunas = parseInt(colsInput.value) || 9;
        generate_board(colunas);
    });

    // ================== DICE SECTION ==================
    const rollDiceBtn = document.getElementById("rollDiceBtn");
    const diceImage = document.getElementById("dice-image");
    const messageBox = document.getElementById("message-box");

    // function to pull dice
    function rollWeightedDice() {
        // define probabilities for each face
        const probabilities = [0.06, 0.25, 0.38, 0.25, 0.06];

        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];
            if (random < cumulative) return i;
        }
        return probabilities.length - 1; // fallback (just in case)
    }

    rollDiceBtn.addEventListener("click", () => {
        // pulls random number (weighted)
        const result = rollWeightedDice(); 
        // updates image
        diceImage.src = `images/dice_${result}.png`;
        
        // prints messages
        let message = "";
        switch (result) {
            case 0:
                message = "🎲 It´s a 0, move 6 places. Play again!";
                break;
            case 1:
                message = "🎲 It´s a 1, move 1 place. Play again!";
                break;
            case 2:
                message = "🎲 It´s a 2, move 2 places.";
                break;
            case 3:
                message = "🎲 It´s a 3, move 3 places.";
                break;
            case 4:
                message = "🎲 It´s a 4, move 4 places. Play again!";
                break;
        }

        // shows the message
        messageBox.textContent = message;
    });

});
