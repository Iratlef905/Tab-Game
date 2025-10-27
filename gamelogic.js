document.addEventListener("DOMContentLoaded", () => {

// ================== BOARD SECTION ==================

    // Link HTML elements to JS variables
    const board = document.getElementById("board");   // Container for board cells
    const colsInput = document.getElementById("cols"); // Input to set number of columns
    const resetBtn = document.getElementById("resetBtn"); // Button to reset the board

    // Function to generate the game board dynamically
    function generate_board(colunas = 9, linhas = 4) {
        board.innerHTML = ""; // Clear existing board content

        // Set up the grid layout for the board
        board.style.gridTemplateColumns = `repeat(${colunas}, 56px)`; // Column width fixed to 56px
        board.style.gridTemplateRows = `repeat(${linhas}, 56px)`;    // Row height fixed to 56px

        // Create cells and populate pieces
        for (let linha = 0; linha < linhas; linha++) {
            for (let coluna = 0; coluna < colunas; coluna++) {
                const cell = document.createElement("div");   // Create a div for each cell
                cell.classList.add("cell");                    // Assign "cell" CSS class

                // Place initial pieces: red on top row, blue on bottom row
                if (linha === 0) {
                    const piece = document.createElement("div");
                    piece.classList.add("piece", "red");      // Red piece
                    piece.draggable = true;                   // Make draggable
                    cell.appendChild(piece);                  // Add to cell
                } else if (linha === linhas - 1) {
                    const piece = document.createElement("div");
                    piece.classList.add("piece", "blue");     // Blue piece
                    piece.draggable = true;                   // Make draggable
                    cell.appendChild(piece);                  // Add to cell
                }

                // Enable drag-and-drop events for each cell
                cell.addEventListener("dragover", (e) => e.preventDefault()); // Allow drop
                cell.addEventListener("drop", (e) => {
                    e.preventDefault();
                    const dragged = document.querySelector(".dragging");
                    if (dragged) {
                        const existing = cell.querySelector(".piece"); // Remove existing piece if any
                        if (existing) existing.remove();
                        cell.appendChild(dragged);                     // Drop dragged piece
                    }
                });

                board.appendChild(cell); // Add cell to board container
            }
        }

        // Add dragstart and dragend events to all pieces
        const pieces = board.querySelectorAll(".piece");
        pieces.forEach((piece) => {
            piece.addEventListener("dragstart", () => piece.classList.add("dragging"));
            piece.addEventListener("dragend", () => piece.classList.remove("dragging"));
        });
    }

    generate_board(); // Generate the initial board on page load

    // Update board when column input changes
    colsInput.addEventListener("input", (e) => {
        let colunas = parseInt(e.target.value) || 9;

        if (colunas % 2 === 0) {     // Ensure number of columns is odd
            colunas += 1;
            e.target.value = colunas; // Update input to reflect adjustment
        }

        // Limit number of columns between 7 and 15
        if (colunas < 7) colunas = 7;
        if (colunas > 15) colunas = 15;

        generate_board(colunas);      // Regenerate board with new column count
    });

    // Reset board to current input value when reset button is clicked
    resetBtn.addEventListener("click", () => {
        const colunas = parseInt(colsInput.value) || 9;
        generate_board(colunas);
    });

// ================== SETTINGS SECTION ==================

    // Link HTML elements to JS variables for later use
    const startGameBtn = document.getElementById("startGameBtn");     // "Start Game" button
    const opponentSelect = document.getElementById("opponentSelect"); // Dropdown for choosing opponent (player/computer)
    const difficultySelect = document.getElementById("difficultySelect"); // Dropdown for difficulty level (only for computer)
    const columnsSelect = document.getElementById("columnsSelect");   // Dropdown for selecting number of board columns

    // When opponent selection changes, enable or disable difficulty selection accordingly
    opponentSelect.addEventListener("change", () => {
        if (opponentSelect.value === "computer") difficultySelect.disabled = false;  // Enable difficulty if computer opponent
        else difficultySelect.disabled = true;                                       // Disable otherwise
    });

    // Start new game when "Start Game" button is clicked
    startGameBtn.addEventListener("click", () => {
        const opponent = opponentSelect.value;          // "computer" or "player"
        const difficulty = difficultySelect.value;      // "easy", "medium", "hard"
        const columns = parseInt(columnsSelect.value);  // Convert number of columns from string to integer

        isComputerOpponent = opponent === "computer";   // Boolean flag for opponent type
        currentTurn = "red";                            // Red player always starts first

        generate_board(columns);                        // Create new board based on selected size
        const messageBox = document.getElementById("message-box"); // Get reference to message display area

        // Update message box with game info (including difficulty if vs. computer)
        messageBox.textContent = 
            `New game started against ${opponent}${opponent === "computer" ? " (" + difficulty + " difficulty)" : ""} on a ${columns}-column board. Good luck!`;

        // Start appropriate game mode based on opponent type
        if (isComputerOpponent) setupPlayerVsComputer(difficulty);  // Initialize Player vs Computer mode
        else setupPlayerVsPlayer();                                 // Initialize Player vs Player mode
    });


// ================== DICE SECTION ==================

    // Link HTML elements to JavaScript variables for later interaction
    const rollDiceBtn = document.getElementById("rollDiceBtn"); // Button that triggers dice roll
    const diceImage = document.getElementById("dice-image");     // Image showing the rolled dice face
    const messageBox = document.getElementById("message-box");   // Text area displaying game messages

    // Function to simulate a *weighted* dice roll — not all numbers have equal probability
    function rollWeightedDice() {
        const probabilities = [0.06, 0.25, 0.38, 0.25, 0.06]; // Probabilities for faces 0–4
        const random = Math.random(); // Random value between 0 and 1
        let cumulative = 0;

        // Loop through probabilities to find which face the random value corresponds to
        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];          // Add probability weight to cumulative total
            if (random < cumulative) return i;       // Return index (dice face) once threshold is passed
        }
        return probabilities.length - 1;             // Fallback (should never normally occur)
    }

    // Event listener: triggered when player clicks "Roll Dice"
    rollDiceBtn.addEventListener("click", () => {
        const result = rollWeightedDice();                     // Generate weighted dice result (0–4)
        diceImage.src = `images/dice_${result}.png`;           // Change dice image based on result

        // Create message text depending on dice result
        let message = "";
        switch (result) {
            case 0: message = "🎲 It’s a 0, move 6 places. Play again!"; break;
            case 1: message = "🎲 It’s a 1, move 1 place. Play again!"; break;
            case 2: message = "🎲 It’s a 2, move 2 places."; break;
            case 3: message = "🎲 It’s a 3, move 3 places."; break;
            case 4: message = "🎲 It’s a 4, move 4 places. Play again!"; break;
        }

        messageBox.textContent = message; // Display the message in the message area
    });

// ================== AI LOGIC ==================

});
