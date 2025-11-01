// === Class representing a single game piece (red or blue) ===
class Piece {
    constructor(color) {
        this.color = color;                               // Stores the color of the piece ("red" or "blue")
        this.moved = false;                               // Tracks whether the piece has moved yet
        this.isLastRow = false;                           // Indicates if the piece has reached the final row
        this.domElement = document.createElement("div");  // Creates the visual DOM element for the piece
        this.domElement.classList.add("piece", this.color); // Applies base "piece" class and color-specific styling
    }

    // === Marks that the piece has made its first move ===
    firstmove() {
        this.moved = true;                                // Updates the state to indicate movement
    }

    // === Marks that the piece has reached the last row ===
    reachedLastRow() {
        this.isLastRow = true;                            // Updates the state to indicate the final position
    }

    // === Moves or places the piece visually on the board ===
    animate(cell) {
        cell.appendChild(this.domElement);                 // Adds the piece’s DOM element to the given cell
    }

    // === Attaches a click handler for user interaction ===
    setClickHandler(callback) {
        this.domElement.onclick = () => callback(this);    // Calls the provided callback when the piece is clicked
    }
}

// === Class representing the game board and its pieces ===
class Board {
    // === Initializes the board with given columns and starting player color ===
    constructor(columns, playerColor) {
        this.boardElement = document.getElementById("board");       // DOM element containing the board
        this.columns = columns;                                     // Number of columns on the board
        this.rows = 4;                                              // Fixed number of rows
        this.currentPlayer = playerColor;                           // Tracks which player's turn it is
        this.cells = Array.from({ length: this.rows }, () => Array(columns).fill(null)); // 2D array of board cells
        this.pieces = new Array(columns * this.rows).fill(null);    // 1D array tracking all pieces on board

        this.showBoard();                                           // Render initial board
    }

    // === Resets and creates a new board with the given configuration ===
    newBoard(columns, playerColor){
        this.boardElement.innerHTML = "";                            // Clear any existing cells
        this.columns = columns;                                      // Set new number of columns
        this.rows = 4;                                               // Reset fixed number of rows
        this.currentPlayer = playerColor;                            // Set starting player
        this.cells = Array.from({ length: this.rows }, () => Array(columns).fill(null)); // Reset cell array
        this.pieces = new Array(columns * this.rows).fill(null);     // Reset pieces array

        this.showBoard();                                            // Render new board
    }

    // === Generates the board cells and initial pieces ===
    showBoard(){
        this.boardElement.style.gridTemplateColumns = `repeat(${this.columns}, 56px)`; // Set column grid
        this.boardElement.style.gridTemplateRows = `repeat(${this.rows}, 56px)`;       // Set row grid
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                let cell = document.createElement("div");             // Create a cell div
                cell.classList.add("cell");                          // Add "cell" styling class
                this.boardElement.appendChild(cell);                 // Append cell to board container
                this.cells[row][col] = cell;                         // Store cell reference

                // Place red pieces on top row
                if (row === 0){
                    let piece = new Piece("red");                    // Create red piece
                    this.pieces[row * this.columns + col] = piece;   // Store piece in array
                }
                // Place blue pieces on bottom row
                else if (row === this.rows - 1){
                    let piece = new Piece("blue");                   // Create blue piece
                    this.pieces[row * this.columns + col] = piece;   // Store piece in array
                }
            }
        }
        this.showPieces();                                           // Render all pieces on the board
    }

    // === Renders all pieces onto their corresponding cells ===
    showPieces() {
        // Remove existing pieces from cells first to avoid duplicates
        this.boardElement.querySelectorAll('.piece').forEach(p => p.remove());

        for (let idx = 0; idx < this.pieces.length; idx++) {
            const piece = this.pieces[idx];                          // Get the piece at this index
            if (!piece) continue;                                    // Skip if no piece

            const row = Math.floor(idx / this.columns);              // Calculate row position
            const col = idx % this.columns;                          // Calculate column position
            const cell = this.cells[row][col];                       // Get corresponding cell
            piece.animate(cell);                                     // Place piece DOM element in cell
        }
    }

    // === Displays a message to the player in the message box ===
    showMessage(text){
        const messageBox = document.getElementById("message-box");   // Get message box element
        messageBox.textContent = text;                               // Update displayed message
    }
}

// === Class representing a weighted dice with UI integration ===
class Dice {
    // === Initializes Dice with roll button, dice image, message box, and callback ===
    constructor(onRoll) {
        this.rollButton = document.getElementById("rollDiceBtn"); // Button to roll the dice
        this.diceImage = document.getElementById("dice-image");   // Image element to show dice face
        this.messageBox = document.getElementById("message-box"); // Message box for feedback

        this.result = null;                                      // Stores last dice result
        this.onRoll = onRoll;                                    // Callback to execute after rolling

        if (this.rollButton) {
            this.rollButton.addEventListener("click", () => this.rollDice()); // Attach click listener
        }
    }

    // === Rolls the dice according to a weighted probability distribution ===
    rollWeightedDice() {
        const probabilities = [0.06, 0.25, 0.38, 0.25, 0.06];  // Probabilities for 0–4
        const random = Math.random();                           // Random number between 0 and 1
        let cumulative = 0;

        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];                     // Accumulate probabilities
            if (random < cumulative) return i;                  // Return value when random fits interval
        }
        return probabilities.length - 1;                        // Fallback: return last index
    }

    // === Rolls dice, updates image and message, and triggers callback ===
    rollDice() {
        this.result = this.rollWeightedDice();                 // Get weighted result
        this.updateDiceImage();                                 // Update dice face in UI
        this.message();                                         // Show message in UI

        let steps = this.result === 0 ? 6 : this.result;       // Treat 0 as 6 for movement

        if (this.onRoll) this.onRoll(steps);                  // Call game callback with steps
    }

    // === Updates the dice image to match the last result ===
    updateDiceImage() {
        if (this.diceImage) {
            this.diceImage.src = `images/dice_${this.result}.png`; // Set dice image source
        }
    }

    // === Displays a message in the UI depending on dice result ===
    message() {
        if (!this.messageBox) return;

        let message = "";
        switch (this.result) {
            case 0: message = "🎲 It’s a 0, move 6 places. Play again!"; break;
            case 1: message = "🎲 It’s a 1, move 1 place. Play again!"; break;
            case 2: message = "🎲 It’s a 2, move 2 places."; break;
            case 3: message = "🎲 It’s a 3, move 3 places."; break;
            case 4: message = "🎲 It’s a 4, move 4 places. Play again!"; break;
        }

        this.messageBox.textContent = message;               // Update message box text
    }
}

// === Class representing the game logic and turn management ===
class Game {
    // === Initializes the game with a board, dice, and starting player ===
    constructor(rows, playerColor){
        this.board = new Board(rows, playerColor);                     // Create a new Board instance
        this.dice = new Dice((result) => this.onDiceRolled(result));   // Create Dice instance with callback
        this.diceResult = null;                                        // Store result of last dice roll
        this.extraMove = false;                                        // Tracks if player can roll again
        this.board.showMessage(`${this.board.currentPlayer} starts! Roll the dice.`); // Initial message
    }

    // === Handles dice result and determines if extra move is allowed ===
    onDiceRolled(result) {
        this.diceResult = result;                                      // Save dice result

        if (result === 1 || result === 4 || result === 6) {
            this.extraMove = true;                                     // Player gets an extra move
            this.board.showMessage(`${this.board.currentPlayer} rolled ${result}. Move a piece and then roll again!`);
        } else if (result === 2 || result === 3) {
            this.extraMove = false;                                    // Turn ends after next move
            this.board.showMessage(`${this.board.currentPlayer} rolled ${result}. Move a piece, then turn ends.`);
        }

        this.enablePieceClicks();                                       // Activate clickable pieces for this turn
    }

    // === Makes all pieces clickable and sets click callback ===
    enablePieceClicks() {
        this.board.pieces.forEach(piece => {
            if (piece) {
                piece.setClickHandler((clickedPiece) => this.onPieceClicked(clickedPiece)); // Attach handler
            }
        });
    }

    // === Disables clicks on all pieces to prevent interaction ===
    disablePieceClicks() {
        this.board.pieces.forEach(piece => {
            if(piece) piece.domElement.onclick = null;                // Remove onclick handler
        });
    }

    // === Triggered when a piece is clicked; handles movement, capturing, and turn logic ===
    async onPieceClicked(piece) {
        if (piece.isLastRow) {
            this.board.showMessage("Essa peça já chegou à última fila e não pode mover-se mais!");
            return;
        }
        
        if (piece.color !== this.board.currentPlayer) {              // Check piece belongs to current player
            this.board.showMessage("You can't move pieces of the opponent!");
            return;
        }

        if (this.diceResult === null) {                              // Ensure dice has been rolled
            this.board.showMessage("Roll the dice first!");
            return;
        }

        let destination = this.getDestination(piece);                // Calculate target cell index

        const targetPiece = this.board.pieces[destination];          // Check if target cell is occupied
        if (targetPiece && targetPiece.color !== this.board.currentPlayer) {
            targetPiece.domElement.remove();                         // Remove opponent piece
        } else if (targetPiece && targetPiece.color === this.board.currentPlayer) {
            this.board.showMessage("You can't move onto your own piece!");
            return;
        }

        const choices = this.decidingPoint(piece);                   // Check if piece is at a decision point

        if (choices) {
            // Highlight possible cells and wait for player click
            choices.forEach(idx => {
                const cell = this.board.cells[Math.floor(idx / this.board.columns)][idx % this.board.columns];
                cell.classList.add("highlight");
                cell.onclick = () => {
                    this.disableHighlights();                       // Clear highlights after choice
                    this.movePieceForward(piece, idx);              // Move piece to chosen cell
                };
            });
        } else {
            this.movePieceForward(piece, destination);               // Move piece normally
        }

        this.disablePieceClicks();                                   // Disable further clicks until next turn

        if (!this.checkWinCondition()) return;                       // Check if the game is over

        // Determine if turn ends or player rolls again
        if (this.diceResult === 2 || this.diceResult === 3) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Small pause before switching turn
            this.switchTurn();
            this.diceResult = null;
            this.board.showMessage(`${this.board.currentPlayer}'s turn! Roll the dice.`);
        } else if (this.extraMove) {
            this.diceResult = null;                                   // Reset dice for extra move
            this.board.showMessage(`${this.board.currentPlayer} can roll again!`);
        }
    }

    // === Determines if a piece is at a decision point and returns alternative destinations ===
    decidingPoint(piece) {
        const index = this.board.pieces.indexOf(piece);             // Find the piece's index
        if (index === -1) return null;

        const row = Math.floor(index / this.board.columns);         // Compute current row
        const destination = this.getDestination(piece);             // Compute normal destination

        // --- Blue decision logic: from row 1 to 0, give two possible destinations ---
        if (piece.color === "blue" && row === 1 && Math.floor(destination / this.board.columns) === 0) {
            return [destination, destination + 2 * this.board.columns]; // Original + alternative path
        }

        // --- Red decision logic: from row 2 to 3, give two possible destinations ---
        if (piece.color === "red" && row === 2 && Math.floor(destination / this.board.columns) === 3) {
            return [destination, destination - 2 * this.board.columns]; // Original + alternative path
        }

        return null;                                                // No decision point
    }

    // === Checks if either player has won the game ===
    checkWinCondition() {
        let hasRed = false, hasBlue = false;

        for (let piece of this.board.pieces) {
            if (piece) {
                if (piece.color === "red") hasRed = true;          // Track red pieces
                if (piece.color === "blue") hasBlue = true;        // Track blue pieces
            }
        }

        if (!hasRed) {                                             // Blue wins
            this.board.showMessage("Blue wins!");
            return false;
        } else if (!hasBlue) {                                     // Red wins
            this.board.showMessage("Red wins!");
            return false;
        }
        return true;                                               // Game continues
    }

    // === Calculates the destination index for a piece based on dice roll ===
    getDestination(piece) {
        if(this.diceResult === null) return;
        let steps = this.diceResult;
        const index = this.board.pieces.indexOf(piece);
        if (index === -1) return;

        let row = Math.floor(index / this.board.columns);
        let col = index % this.board.columns;

        while (steps > 0) {                                        // Move piece step by step
            if (piece.color === "blue") {
                if (row % 2 === 0) col--; else col++;             // Snake-like horizontal movement
                if (col >= this.board.columns) { col = this.board.columns - 1; row--; }
                if (col < 0) { col = 0; row = (row === 0) ? row + 1 : row - 1; }
            } else {                                               // Red movement downwards
                if (row % 2 === 0) col--; else col++;
                if (col >= this.board.columns) { col = this.board.columns - 1; row = (row === 3) ? row - 1 : row + 1; }
                if (col < 0) { col = 0; row++; }
            }
            steps--;
        }

        return row * this.board.columns + col;                     // Return linear index of destination
    }

    // === Moves a piece to a specific cell and updates board array ===
    movePieceForward(piece, destination){
        const index = this.board.pieces.indexOf(piece);
        let row = Math.floor(destination / this.board.columns);
        let col = destination % this.board.columns;
        
        if (piece.isLastRow) { // checks if the piece already been in last row, and if so stops it
            if ((piece.color === "red" && row === this.board.rows - 1) ||
                (piece.color === "blue" && row === 0)) {
                this.board.showMessage("That piece has been to the final row, so it can´t enter again!");
                return; // cancels the move
            }
        }

        this.board.pieces[index] = null;                           // Remove piece from old position
        this.board.pieces[destination] = piece;                    // Place piece in new position

        const cell = this.board.cells[row][col];
        piece.animate(cell); // Update DOM

        if ((piece.color === "red" && row === this.board.rows - 1) ||
            (piece.color === "blue" && row === 0)) {
            piece.reachedLastRow();
        }
    }

    // === Removes all highlights and click handlers from decision cells ===
    disableHighlights() {
        this.board.cells.flat().forEach(cell => {
            cell.classList.remove("highlight");                   // Remove highlight class
            cell.onclick = null;                                   // Disable onclick
        });
    }

    // === Switches current player and optionally flips the board visually ===
    switchTurn(){
        this.board.currentPlayer = this.board.currentPlayer === "blue" ? "red" : "blue";
        if (this.board.currentPlayer === 'red') {
            this.board.boardElement.classList.add('flipped');     // Flip board for red
        } else {
            this.board.boardElement.classList.remove('flipped');  // Unflip for blue
        }
        this.board.showMessage(`${this.board.currentPlayer}'s turn! Roll the dice.`);
    }
}


document.addEventListener("DOMContentLoaded", () => {

    //Generate initial standard Board with 9 columns and blue starting
    const game = new Game(9, "blue");

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
        currentTurn = "red";                            // Red player starts first

        gameBoard.newBoard(columns, "red");                  // Create new board based on selected size
        const messageBox = document.getElementById("message-box"); // Get reference to message display area

        // Update message box with game info (including difficulty if vs. computer)
        messageBox.textContent = 
            `New game started against ${opponent}${opponent === "computer" ? " (" + difficulty + " difficulty)" : ""} on a ${columns}-column board. Good luck!`;

        // Start appropriate game mode based on opponent type
        if (isComputerOpponent) setupPlayerVsComputer(difficulty);  // Initialize Player vs Computer mode
        else setupPlayerVsPlayer();                                 // Initialize Player vs Player mode
    });

/*
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
*/
// ================== AI LOGIC ==================

});
