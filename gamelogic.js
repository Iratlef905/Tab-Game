// === Class representing a single game piece (red or blue) ===
class Piece {
    constructor(color) {
        this.color = color;                               // Stores the color of the piece ("red" or "blue")
        this.wasMoved = false;                             // Tracks whether the piece has already been moved
        this.wasAlreadyInLastRow = false;                 // Tracks if piece reached the final row for special state
        this.domElement = document.createElement("div");  // Creates a new div element representing the piece visually
        this.domElement.classList.add("piece", this.color); // Adds base "piece" class and color-specific class for styling
    }

    // === Marks that the piece has made its first move ===
    firstmove() {
        this.wasMoved = true;                              // Update internal state indicating the piece has moved
        this.domElement.classList.add("moved");           // Apply "moved" class to adjust opacity visually
    }

    // === Marks that the piece has reached the last row ===
    reachedLastRow() {
        this.wasAlreadyInLastRow = true;                  // Update state to indicate final row reached
        this.domElement.classList.add("final");           // Apply "final" class to visually indicate completion (100% opacity)
    }

    // === Places the piece visually into a given board cell ===
    animate(cell) {
        cell.appendChild(this.domElement);                // Append piece DOM element into the specified cell
    }

    // === Sets a click event handler on the piece ===
    setClickHandler(callback) {
        this.domElement.onclick = () => callback(this);   // Calls the provided callback with this piece when clicked
    }
}

// === Class representing the game board and pieces ===
class Board {
    // === Initializes the board with number of columns and starting player color ===
    constructor(columns, playerColor) {
        this.boardElement = document.getElementById("board"); // Reference to the DOM container for the board
        this.columns = columns;                               // Number of columns in the board
        this.rows = 4;                                        // Fixed number of rows
        this.currentPlayer = playerColor;                     // Tracks which player's turn it is
        this.cells = Array.from({ length: this.rows }, () => Array(columns).fill(null)); // 2D array storing references to board cells
        this.pieces = new Array(columns * this.rows).fill(null); // 1D array storing all pieces on the board

        this.showBoard();                                     // Render the initial empty board and initial pieces
    }

    // === Resets and creates a new board with updated columns and player color ===
    newBoard(columns, playerColor){
        this.boardElement.innerHTML = "";                     // Clear existing cells in the DOM
        this.columns = columns;                               // Update number of columns
        this.rows = 4;                                        // Keep number of rows fixed
        this.currentPlayer = playerColor;                     // Set starting player
        this.cells = Array.from({ length: this.rows }, () => Array(columns).fill(null)); // Reset the 2D cell array
        this.pieces = new Array(columns * this.rows).fill(null); // Reset the pieces array

        this.showBoard();                                     // Render the new board
    }

    // === Generates board cells and places initial red/blue pieces ===
    showBoard(){
        this.boardElement.style.gridTemplateColumns = `repeat(${this.columns}, 56px)`; // Set board column layout in CSS grid
        this.boardElement.style.gridTemplateRows = `repeat(${this.rows}, 56px)`;       // Set board row layout

        for (let row = 0; row < this.rows; row++) {           // Loop through rows
            for (let col = 0; col < this.columns; col++) {   // Loop through columns
                let cell = document.createElement("div");    // Create a div representing a cell
                cell.classList.add("cell");                  // Add "cell" class for styling
                this.boardElement.appendChild(cell);         // Append cell to board container
                this.cells[row][col] = cell;                 // Store reference to this cell in 2D array

                if (row === 0){                               // Top row: initialize red pieces
                    let piece = new Piece("red");             // Create red piece object
                    this.pieces[row * this.columns + col] = piece; // Store piece in 1D array
                } else if (row === this.rows - 1){           // Bottom row: initialize blue pieces
                    let piece = new Piece("blue");            // Create blue piece object
                    this.pieces[row * this.columns + col] = piece; // Store piece in 1D array
                }
            }
        }

        // === Add directional arrows to each cell to indicate piece movement direction ===
        const cells = this.boardElement.querySelectorAll('.cell'); // Get all cell elements
        cells.forEach((cell, i) => {
            const row = Math.floor(i / this.columns);               // Determine row index from 1D loop
            const arrow = document.createElement('span');           // Create span for arrow
            arrow.classList.add('arrow');                           // Add "arrow" class for styling
            arrow.textContent = row % 2 === 0 ? '←' : '→';         // Alternate arrows per row: left for even, right for odd
            cell.appendChild(arrow);                                // Append arrow to cell
        })

        this.showPieces();                                          // Render all pieces into their corresponding cells
    }

    // === Renders all pieces onto their respective board cells ===
    showPieces() {
        this.boardElement.querySelectorAll('.piece').forEach(p => p.remove()); // Remove existing piece elements to avoid duplicates

        for (let idx = 0; idx < this.pieces.length; idx++) {
            const piece = this.pieces[idx];                        // Get piece at current index
            if (!piece) continue;                                  // Skip if no piece present

            const row = Math.floor(idx / this.columns);            // Calculate row index
            const col = idx % this.columns;                        // Calculate column index
            const cell = this.cells[row][col];                     // Get corresponding cell element
            piece.animate(cell);                                   // Append piece DOM element into the cell
        }
    }

    // === Displays a message in the message box on the page ===
    showMessage(text){
        const messageBox = document.getElementById("message-box");  // Get DOM element for messages
        messageBox.textContent = text;                              // Set displayed text to provided string
    }
}

// === Class representing a weighted dice with UI integration ===
class Dice {
    // === Initializes Dice with roll button, dice image, and callback ===
    constructor(onRoll) {
        this.rollButton = document.getElementById("rollDiceBtn"); // Reference to the button DOM element
        this.diceImage = document.getElementById("dice-image");   // Reference to the dice image DOM element

        this.result = null;                                      // Stores last rolled value
        this.onRoll = onRoll;                                    // Callback function triggered after dice roll

        this.isOnline = false;
        this.serverRequests = null;

        if (this.rollButton) {
            this.rollButton.addEventListener("click", () => this.rollDice()); // Attach click listener to roll dice
        }
    }

    enableOnlineMode(serverRequests) {
        this.isOnline = true;
        this.serverRequests = serverRequests;
    }

    updateFromServer(value) {
        this.result = value;

        this.updateDiceImage(); 
        this.rollButton.disabled = false;

        let steps = value === 0 ? 6 : value;
        if (this.onRoll) this.onRoll(steps); 
    }

    // === Rolls the dice using a weighted probability distribution ===
    rollWeightedDice() {
        const probabilities = [0.06, 0.25, 0.38, 0.25, 0.06];  // Probabilities for values 0–4 (weighted)
        const random = Math.random();                           // Generate random number 0–1
        let cumulative = 0;                                     // Cumulative probability tracker

        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];                     // Increment cumulative probability
            if (random < cumulative) return i;                  // Return current value if random falls within interval
        }
        return probabilities.length - 1;                        // Fallback: return last index
    }

    // === Rolls dice, updates image, message, and calls callback ===
    async rollDice() {
        this.rollButton.disabled = true;                        // Prevent multiple clicks while rolling
        if(!this.isOnline){
            this.result = this.rollWeightedDice();                 // Generate weighted dice result
            this.updateDiceImage();                                 // Update dice image to match result

            let steps = this.result === 0 ? 6 : this.result;       // Treat 0 as 6 for movement logic

            if (this.onRoll) this.onRoll(steps);                   // Call provided callback with steps
        }else{
            console.log("Rolling via server…");

            this.rollButton.disabled = true;

            await this.serverRequests.roll(
                this.serverRequests.nick,
                this.serverRequests.password,
                this.serverRequests.gameID
            );
            return;
        }
    }

    // === Updates the dice image according to last rolled value ===
    updateDiceImage() {
        if (this.diceImage) {
            this.diceImage.src = `images/dice_${this.result}.png`; // Update image source to match dice value
        }
    }

    // === Resets dice image to initial state (used after player action) ===
    resetDiceImage() {
        if (this.diceImage) {
            this.diceImage.src = "images/initial_dice.png";    // Reset to default initial dice image
        }
    }
}

// === Class representing game logic and turn management ===
class Game {
    // === Initializes the game with board, dice, starting player, and UI elements ===
    constructor(rows, playerColor){
        this.board = new Board(rows, playerColor);                     // Create Board instance
        this.dice = new Dice((result) => this.onDiceRolled(result));   // Create Dice instance with callback
        this.diceResult = null;                                        // Store last dice result
        this.isServerGame = false;
        this.serverRequests = null;
        this.extraMove = false;                                        // Tracks if player gets an extra move
        this.dice.rollButton.disabled = false;                         // Enable dice roll button initially
        this.board.showMessage(`Player ${this.board.currentPlayer} starts! Roll the dice.`); // Initial message

        // === Skip Turn button setup ===
        this.skipTurnButton = document.getElementById("skipTurnBtn");  // Reference to skip button
        if (this.skipTurnButton) {
            this.skipTurnButton.addEventListener("click", () => {
                if (this.isServerGame) {
                    this.skipTurnOnline();
                } else {
                    this.skipTurn();
                    this.skipTurnButton.disabled = true;                        // Initially disabled until needed
                }
            });
        }
    }

    enableOnlineMode(){
        this.isServerGame = true;
        this.serverRequests = new ServerRequests();
    }

    // === Handles dice result and determines extra move or turn end ===
    onDiceRolled(result) {
        this.diceResult = result;                                      // Save the dice result

        if (result === 1 || result === 4 || result === 6) {            // Values granting extra turn
            this.extraMove = true;                                     // Set extra move flag
            this.board.showMessage(`Player ${this.board.currentPlayer} rolled ${result}. Move a piece and then roll again!`);
        } else if (result === 2 || result === 3) {                     // Values ending turn
            this.extraMove = false;                                    // No extra move
            this.board.showMessage(`Player ${this.board.currentPlayer} rolled ${result}. Move a piece, then turn ends.`);
        }

        // Check if current player has any available moves
        const movesAvailable = this.hasAvailableMoves();

        if (!movesAvailable && this.extraMove) {                       // No moves but extra roll allowed
            this.board.showMessage(`Player ${this.board.currentPlayer} rolled ${result} but has no moves. Roll again!`);
            this.dice.rollButton.disabled = false;                     // Enable roll button
            this.disablePieceClicks();                                  // Disable piece interaction
            this.skipTurnButton.disabled = true;                        // Skip button remains disabled
        } else if (!movesAvailable && !this.extraMove) {               // No moves and turn ends
            this.board.showMessage(`Player ${this.board.currentPlayer} has no possible moves. Click "Skip Turn" to continue the game.`);
            this.skipTurnButton.disabled = false;                      // Enable skip turn button
            this.disablePieceClicks();                                  // Disable piece interaction
        } else {                                                        // Moves available
            this.enablePieceClicks();                                   // Enable interaction with pieces
            this.skipTurnButton.disabled = true;                        // Skip button disabled
        }

        if (this.ai && this.board.currentPlayer === "red") {            // AI moves for red player if present
            setTimeout(() => this.ai.makeMove(), 1000);                // Delay AI move for 1 second
        }
    }

    // === Determines if the current player has any valid moves ===
    hasAvailableMoves() {
        const playerColor = this.board.currentPlayer;
        return this.board.pieces.some(piece => {                        // Check each piece
            if (!piece || piece.color !== playerColor) return false;   // Skip if piece is missing or wrong color
            if (!piece.wasMoved && this.diceResult !== 1) return false;// Skip if piece can't move yet
            if (this.isBlockedByStartRow(piece)) return false;         // Skip if blocked by starting row

            const choices = this.decidingPoint(piece);                 // Determine possible destinations
            if (choices && Array.isArray(choices)) {
                return choices.some(idx => {                            // Check if any choice is available
                    if (idx == null) return false;
                    const targetPiece = this.board.pieces[idx];
                    return !targetPiece || targetPiece.color !== playerColor; // Valid if target empty or enemy
                });
            }
            const destination = this.getDestination(piece);            // Fallback destination
            const targetPiece = this.board.pieces[destination];
            return !targetPiece || targetPiece.color !== playerColor;   // Valid move if target empty or enemy
        });
    }

    // === Allows player to skip their turn if no moves are available ===
    skipTurn() {
        this.skipTurnButton.disabled = true;  // Disable skip button after use
        this.diceResult = null;               // Reset dice result for new turn
        this.disablePieceClicks();            // Prevent further piece interaction
        this.switchTurn();                    // Switch to the other player's turn
        this.dice.rollButton.disabled = false; // Enable dice roll button for next player
        this.dice.resetDiceImage();           // Reset dice image to initial state
    }

    async skipTurnOnline() {
        await this.serverRequests.pass(
                        this.serverRequests.nick,
                        this.serverRequests.password,
                        this.serverRequests.gameID);
        return;
    }

    // === Enables clicks on all pieces for current player ===
    enablePieceClicks() {
        this.board.pieces.forEach(piece => {
            if (piece) {
                piece.setClickHandler((clickedPiece) => this.onPieceClicked(clickedPiece)); // Attach click callback
            }
        });
    }

    // === Disables clicks on all pieces to block interaction ===
    disablePieceClicks() {
        this.board.pieces.forEach(piece => {
            if(piece) piece.domElement.onclick = null; // Remove click handlers
        });
    }

    // === Handles piece click: movement, capturing, and turn logic ===
    async onPieceClicked(piece) {
        if(this.isServerGame){
            await this.serverRequests.notify(
                this.serverRequests.nick,
                this.serverRequests.password,
                this.serverRequests.gameID,
                this.board.pieces.indexOf(piece));
        }

        if (piece.color !== this.board.currentPlayer) {              // Ensure player can only move own pieces
            this.board.showMessage("You can't move pieces of the opponent!");
            return;
        }

        if (this.diceResult === null) {                              // Dice must be rolled first
            this.board.showMessage("Roll the dice first!");
            return;
        }

        if(!piece.wasMoved && this.diceResult !== 1){                // First move rule: only 1 allows initial movement
            this.board.showMessage("You can only make the first move of a piece after rolling a 1!");
            return;
        }

        if (this.isBlockedByStartRow(piece)) {                       // Check if piece is blocked by start row restriction
            this.board.showMessage("You cannot move pieces in the last row while you have pieces in the start row.");
            return;
        }

        if(!piece.wasMoved) piece.firstmove();                       // Mark piece as having moved for the first time

        let destination = this.getDestination(piece);               // Calculate default target cell index
        let choices = this.decidingPoint(piece);                    // Check if piece is at a decision point

        if (choices && choices[0] != null && choices[1] === null){  // Single alternative path
            if(this.board.pieces[choices[0]] && this.board.pieces[choices[0]].color === this.board.currentPlayer) {
                this.board.showMessage("You can't move onto your own piece!"); // Prevent collision with own piece
                return;
            }
            destination = choices[0];                                // Set chosen destination
        }

        if (choices && choices[1] != null) {                         // Two possible alternative paths
            if((this.board.pieces[choices[0]] && this.board.pieces[choices[0]].color === this.board.currentPlayer) 
                && (this.board.pieces[choices[1]] && this.board.pieces[choices[1]].color === this.board.currentPlayer)) {
                this.board.showMessage("You can't move onto your own piece!"); // Block both occupied by own pieces
                return;
            }
            if(choices[1] && this.board.pieces[choices[0]] && this.board.pieces[choices[0]].color === this.board.currentPlayer) {
                choices = [choices[1]];                              // Remove blocked first option
            } 
            if(choices[1] && this.board.pieces[choices[1]] && this.board.pieces[choices[1]].color === this.board.currentPlayer) {
                choices = [choices[0]];                              // Remove blocked second option
            }

            const chosenIndex = await this.waitForChoice(choices);   // Wait for player to select path
            this.disableHighlights();                                // Remove highlight from cells
            destination = chosenIndex;                                // Set chosen destination
        }

        const targetPiece = this.board.pieces[destination];          // Check for piece in target cell
        if (targetPiece && targetPiece.color !== this.board.currentPlayer) {
            targetPiece.domElement.remove();                         // Remove opponent piece if present
        } else if (targetPiece && targetPiece.color === this.board.currentPlayer) {
            this.board.showMessage("You can't move onto your own piece!"); // Prevent collision with own piece
            return;
        }

        this.movePieceForward(piece, destination);                  // Move the piece visually and logically
        this.disablePieceClicks();                                   // Block further clicks until next dice roll
        this.dice.resetDiceImage();                                  // Reset dice image after move

        if (!this.checkWinCondition()) return;                      // Stop if game is over

        // Determine if turn ends or player can roll again
        if (this.diceResult === 2 || this.diceResult === 3) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Pause for clarity before switching turn
            this.switchTurn();                                       // Switch turn to other player
            this.diceResult = null;                                  // Reset dice
            this.dice.rollButton.disabled = false;                  // Enable roll button for next player
            this.board.showMessage(`Player ${this.board.currentPlayer}'s turn! Roll the dice.`); // Update message
        } else if (this.extraMove) {
            this.diceResult = null;                                  // Reset dice for extra move
            this.dice.rollButton.disabled = false;                  // Enable roll button
            this.board.showMessage(`Player ${this.board.currentPlayer} can roll again!`); // Notify player
        }
    }

    // === Determines if a piece is blocked because start row has unplayed pieces ===
    isBlockedByStartRow(piece) {
        const playerColor = piece.color;                              // Piece's color
        const startRow = playerColor === "blue" ? 3 : 0;              // Row considered "start" for player
        const lastRow = playerColor === "blue" ? 0 : 3;               // Row considered "final" for player

        const index = this.board.pieces.indexOf(piece);               // Find piece index in array
        const row = Math.floor(index / this.board.columns);           // Compute row of piece
        if (row !== lastRow) return false;                            // Only relevant for last row

        const hasStartRowPieces = this.board.pieces.some((p, idx) => { // Check if any pieces still in start row
            if (!p || p.color !== playerColor) return false;
            const r = Math.floor(idx / this.board.columns);
            return r === startRow;
        });

        return hasStartRowPieces;                                     // Return true if start row pieces exist
    }

    // === Determines if a piece is at a decision point and returns alternative destinations ===
    decidingPoint(piece) {
        const index = this.board.pieces.indexOf(piece);               // Get piece index
        if (index === -1) return null;                                // Exit if piece not on board

        const row = Math.floor(index / this.board.columns);           // Compute current row
        const destination = this.getDestination(piece);               // Compute normal destination

        // --- Blue player: decision from row 1 → 0 ---
        if (piece.color === "blue" && row === 1 && Math.floor(destination / this.board.columns) === 0) {
            if (piece.wasAlreadyInLastRow) return [destination + 2 * this.board.columns, null]; // Already at last row → only alternative
            return [destination, destination + 2 * this.board.columns]; // Normal + alternative destination
        }

        // --- Red player: decision from row 2 → 3 ---
        if (piece.color === "red" && row === 2 && Math.floor(destination / this.board.columns) === 3) {
            if (piece.wasAlreadyInLastRow) return [destination - 2 * this.board.columns, null]; // Already at last row → only alternative
            return [destination, destination - 2 * this.board.columns]; // Normal + alternative destination
        }

        return null;                                                  // No decision point
    }

    waitForChoice(choices) {
        return new Promise((resolve) => {                               // Return a promise that resolves when player chooses a cell
            choices.forEach(idx => {                                    // Loop through each possible choice index
                const cell = this.board.cells[Math.floor(idx / this.board.columns)][idx % this.board.columns]; // Get corresponding cell
                cell.classList.add("highlight");                        // Highlight cell to indicate it’s selectable
                this.board.showMessage("Please choose one of the highlighted options to move"); // Prompt player
                cell.onclick = () => {                                   // Attach click handler for this choice
                    resolve(idx);                                       // Resolve promise with chosen index
                };
            });
        });
    }

    // === Checks if either player has won, updates scoreboard, and returns game continuation status ===
    checkWinCondition() {
        let hasRed = false, hasBlue = false;                             // Flags to track if pieces remain for each color

        for (let piece of this.board.pieces) {
            if (piece) {
                if (piece.color === "red") hasRed = true;                // Red piece found
                if (piece.color === "blue") hasBlue = true;              // Blue piece found
            }
        }

        if (!hasRed) {                                                    // No red pieces → Blue wins
            this.board.showMessage("Blue wins!");                        // Display message
            this.updateScoreboard("blue");                                // Update scoreboard
            return false;                                                 // Game over
        } else if (!hasBlue) {                                           // No blue pieces → Red wins
            this.board.showMessage("Red wins!");
            this.updateScoreboard("red");
            return false;
        }

        return true;                                                     // Game continues if both colors exist
    }

    // === Updates the scoreboard for the winner ===
    updateScoreboard(winner) {
        const scoreboard = document.querySelector(".scoreboard table tbody"); // Get table body
        if (!scoreboard) return;

        const rows = scoreboard.querySelectorAll("tr");                  // Get rows for each player
        const blue_p = rows[0];                                          // First row → blue
        const red_p = rows[1];                                           // Second row → red

        if (winner === "blue") {
            const cell = blue_p.querySelectorAll("td")[1];               // Get "Best Result" cell
            let current = parseInt(cell.textContent) || 0;               // Parse current score
            cell.textContent = current + 1;                               // Increment
        } else if (winner === "red") {
            const cell = red_p.querySelectorAll("td")[1];
            let current = parseInt(cell.textContent) || 0;
            cell.textContent = current + 1;
        }
    }

    // === Calculates the linear destination index for a piece based on dice roll ===
    getDestination(piece) {
        if(this.diceResult === null) return;                              // No dice rolled → exit
        let steps = this.diceResult;                                      // Number of steps to move
        const index = this.board.pieces.indexOf(piece);                    // Current piece index
        if (index === -1) return;

        let row = Math.floor(index / this.board.columns);                  // Current row
        let col = index % this.board.columns;                              // Current column

        while (steps > 0) {                                               // Move step by step
            if (piece.color === "blue") {                                  // Blue moves upward
                if (row % 2 === 0) col--; else col++;                     // Snake-like horizontal
                if (col >= this.board.columns) { col = this.board.columns - 1; row--; } // Handle overflow
                if (col < 0) { col = 0; row = (row === 0) ? row + 1 : row - 1; }       // Handle underflow
            } else {                                                        // Red moves downward
                if (row % 2 === 0) col--; else col++;
                if (col >= this.board.columns) { col = this.board.columns - 1; row = (row === 3) ? row - 1 : row + 1; }
                if (col < 0) { col = 0; row++; }
            }
            steps--;                                                       // Reduce remaining steps
        }

        return row * this.board.columns + col;                              // Convert 2D position to linear index
    }

    // === Moves a piece to a new cell and updates board state ===
    movePieceForward(piece, destination){
        const index = this.board.pieces.indexOf(piece);                    // Current piece index
        let row = Math.floor(destination / this.board.columns);            // Destination row
        let col = destination % this.board.columns;                        // Destination column

        if ((piece.color === "blue" && row === 0) ||                       // Blue reaches final row
            (piece.color === "red" && row === this.board.rows - 1)){       // Red reaches final row
                piece.reachedLastRow();                                    // Mark piece visually as final
            }

        this.board.pieces[index] = null;                                    // Remove from old position
        this.board.pieces[destination] = piece;                             // Place in new position
        const cell = this.board.cells[row][col];
        piece.animate(cell);                                                // Update DOM
    }

    // === Removes highlights and onclick handlers from all cells ===
    disableHighlights() {
        this.board.cells.flat().forEach(cell => {
            cell.classList.remove("highlight");                             // Remove highlight class
            cell.onclick = null;                                             // Disable click handler
        });
    }

    // === Switches current player, flips board visually, and manages AI/human turns ===
    switchTurn() {
        this.board.currentPlayer = this.board.currentPlayer === "blue" ? "red" : "blue"; // Toggle player

        if (!this.ai) {                                                     // Only flip for human game
            if (this.board.currentPlayer === "red") {
                this.board.boardElement.classList.add("flipped");           // Red's perspective
            } else {
                this.board.boardElement.classList.remove("flipped");        // Blue's perspective
            }
        }

        this.board.showMessage(`Player ${this.board.currentPlayer}'s turn! Roll the dice.`); // Update message

        if (this.ai && this.board.currentPlayer === "red") {                 // AI turn logic
            this.dice.rollButton.disabled = true;                             // Disable human roll
            setTimeout(() => this.dice.rollDice(), 1500);                     // AI rolls automatically
        } else {
            this.dice.rollButton.disabled = false;                            // Enable for human
        }
    }

    // === Start New Game helper: set player vs player mode ===
    setModePlayer() {
        delete this.aiDifficulty;                                             // Remove AI settings
        if (this.dice?.rollButton) this.dice.rollButton.disabled = false;     // Enable dice
    }

    // === Start New Game helper: set player vs computer mode ===
    setModeComputer(difficulty) {
        this.aiDifficulty = difficulty || "normal";                           // Set AI difficulty
        if (this.dice?.rollButton) this.dice.rollButton.disabled = false;     // Enable dice for player
    }
}

// ================== SIDEBAR UI CONTROLLER ==================
class SidebarUI {
    constructor(gameInstance) {
        this.game = gameInstance;                               // Store reference to the main Game instance

        // Cache important sidebar DOM elements for reuse
        this.startGameBtn = document.getElementById("startGameBtn");         // "Start Game" button
        this.opponentSelect = document.getElementById("opponentSelect");     // Dropdown to choose human or computer
        this.difficultySelect = document.getElementById("difficultySelect"); // AI difficulty dropdown
        this.columnsSelect = document.getElementById("columnsSelect");       // Dropdown for number of board columns
        this.startingPlayerSelect = document.getElementById("StartingPlayerSelect"); // Dropdown for starting player
        this.giveUpBtn = document.getElementById("giveUpBtn");               // "Give Up" button

        this.initializeEvents();                                     // Set up event listeners for sidebar interactions
    }

    initializeEvents() {
        // === Enable or disable difficulty dropdown based on opponent selection ===
        if (this.opponentSelect && this.difficultySelect) {
            this.opponentSelect.addEventListener("change", () => {
                this.difficultySelect.disabled = this.opponentSelect.value !== "computer"; // Enable only if AI opponent
            });
            this.difficultySelect.disabled = this.opponentSelect.value !== "computer";     // Set initial state
        }

        // === Start Game button click handler ===
        if (this.startGameBtn) {
            this.startGameBtn.addEventListener("click", () => this.startGame());
        }

        // === Give Up button click handler ===
        if (this.giveUpBtn) {
            this.giveUpBtn.addEventListener("click", () => this.giveUp());
        }
    }

    // === Starts a new game based on selected options ===
    startGame() {
        const opponent = this.opponentSelect.value;                 // Human or computer
        const difficulty = this.difficultySelect.value;             // AI difficulty
        const columns = parseInt(this.columnsSelect.value);         // Board width
        const startingPlayer = this.startingPlayerSelect.value;     // Starting color

        this.game.board.newBoard(columns, startingPlayer);          // Reset board with new configuration
        this.game.board.currentPlayer = startingPlayer;             // Set starting player
        this.game.dice.rollButton.disabled = false;                 // Enable dice for first roll

        // Adjust board orientation for human vs human games
        if (opponent !== "computer") {
            if (startingPlayer === "red") {
                this.game.board.boardElement.classList.add("flipped"); // Red starts → flip board
            } else {
                this.game.board.boardElement.classList.remove("flipped");
            }
        } else {                                                     // Human vs AI
            this.game.board.boardElement.classList.remove("flipped"); 
            console.log("start game in sidebar: ", this.game.ai);   // Debug log
        }

        // Update message box with game details
        const messageBox = document.getElementById("message-box");
        messageBox.textContent = `New game started against ${opponent}${
            opponent === "computer" ? " (" + difficulty + " difficulty)" : ""
        } on a ${columns}-column board. ${startingPlayer} starts!`;

        // === Initialize AI player if needed ===
        if (opponent === "computer") {
            this.game.ai = new AIPlayer(this.game, difficulty);       // Create AI instance
        } else {
            this.game.ai = null;                                      // No AI for human opponent
        }

        // If AI starts first, auto-roll the dice
        if (this.game.ai && this.game.board.currentPlayer === "red") {
            console.log("detected");                                   // Debug log
            this.game.dice.rollButton.disabled = true;                // Prevent human interaction
            setTimeout(() => this.game.dice.rollDice(), 1500);        // Delay AI roll slightly
        } else {
            this.game.dice.rollButton.disabled = false;               // Enable human roll
        }
    }

    // === Handles "Give Up" functionality ===
    giveUp() {
        const currentPlayer = this.game.board.currentPlayer;            // Player who gave up
        const winner = currentPlayer === "blue" ? "red" : "blue";       // Determine winner

        // Announce winner in message box
        this.game.board.showMessage(`${currentPlayer} gave up! ${winner} wins!`);

        // Update scoreboard with winner
        this.game.updateScoreboard(winner);

        // Disable all current interactions
        this.game.disablePieceClicks();                                 // Disable piece clicks
        if (this.game.dice?.rollButton) this.game.dice.rollButton.disabled = true; // Disable dice
        if (this.game.skipTurnButton) this.game.skipTurnButton.disabled = true;    // Disable skip turn button

        // Automatically start a new game after a 1-second pause
        setTimeout(() => {
            const opponent = this.opponentSelect.value;
            const difficulty = this.difficultySelect.value;
            const columns = parseInt(this.columnsSelect.value);
            const startingPlayer = winner;                              // Loser gave up → winner starts

            this.game.board.newBoard(columns, startingPlayer);          // Reset board
            this.game.board.currentPlayer = startingPlayer;             // Set current player

            // Flip board if red starts
            if (startingPlayer === "red") {
                this.game.board.boardElement.classList.add("flipped");
            } else {
                this.game.board.boardElement.classList.remove("flipped");
            }

            // Update message box with automatic restart info
            const messageBox = document.getElementById("message-box");
            messageBox.textContent = `New game started automatically after ${currentPlayer} gave up. ${startingPlayer} starts!`;

            this.game.dice.rollButton.disabled = false;                 // Enable dice for next turn
        }, 1000);
    }
}
 
// === AI MOVE EVALUATION AND EXECUTION ===
class AIPlayer {
    constructor(game, difficulty = "normal") {
        this.game = game;                   // Reference to the main Game instance
        this.difficulty = difficulty;       // Difficulty setting ("normal" = random, higher = strategic)
    }

    // === Main AI move execution function ===
    async makeMove() {
        const playerColor = this.game.board.currentPlayer; // Always "red" since AI plays red
        const dice = this.game.diceResult;                 // Current dice roll
        let actionMessage = `Red (AI) rolled ${dice}. `;   // Base message for UI

        // === Identify all possible legal moves for AI pieces ===
        const possibleMoves = [];
        this.game.board.pieces.forEach((piece, index) => {
            if (!piece || piece.color !== playerColor) return;           // Skip non-AI pieces
            if (!piece.wasMoved && dice !== 1) return;                   // Can’t move unrolled pieces unless dice = 1
            if (this.game.isBlockedByStartRow(piece)) return;           // Skip if start-row rule blocks movement

            const dest = this.game.getDestination(piece);               // Calculate destination index
            if (dest == null) return;                                    // Skip invalid destinations

            const target = this.game.board.pieces[dest];                 // Check if destination occupied
            if (target && target.color === playerColor) return;          // Skip if occupied by own piece

            const score = this.evaluateMove(piece, dest);               // Score this potential move
            possibleMoves.push({ piece, dest, score, target });         // Save candidate
        });

        // === Handle no available moves scenario ===
        if (possibleMoves.length === 0) {
            if ([1,4,6].includes(dice)) {                               // Extra roll possible
                await new Promise(r => setTimeout(r, 2000));            // Short delay for realism
                this.game.dice.rollDice();                              // Roll again
            } else {
                await new Promise(r => setTimeout(r, 2000));
                this.game.skipTurn(true);                                // Skip turn if no move
            }
            return;
        }

        // === Choose a move based on difficulty ===
        let chosenMove;
        if (this.difficulty === "normal") {
            chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)]; // Random
        } else {
            chosenMove = possibleMoves.reduce((best, m) => m.score > best.score ? m : best); // Best-scoring
        }

        await new Promise(r => setTimeout(r, 1500));                 // Pause to simulate AI thinking
        if (!chosenMove.piece.wasMoved) chosenMove.piece.firstmove(); // Mark first move visually

        // === Handle capturing opponent piece ===
        if (chosenMove.target && chosenMove.target.color !== playerColor) {
            chosenMove.target.domElement.remove();                    // Remove target from DOM
            actionMessage += `Captured a ${chosenMove.target.color} piece. `;
        } else {
            actionMessage += "Moved a piece forward. ";
        }

        this.game.movePieceForward(chosenMove.piece, chosenMove.dest); // Execute move
        this.game.disablePieceClicks();                                 // Prevent human clicks during AI turn

        const gameContinues = this.game.checkWinCondition();           // Check if game ended
        if (!gameContinues) return;                                     // Stop if game over

        // === Determine if AI rolls again or turn switches ===
        if (dice === 1 || dice === 4 || dice === 6) {
            actionMessage += "Gets another roll!";
            this.game.board.showMessage(actionMessage);                 // Update message
            await new Promise(r => setTimeout(r, 1500));
            this.game.dice.rollDice();                                   // Extra roll
        } else {
            actionMessage += "Turn ends.";
            this.game.board.showMessage(actionMessage);                 // Update message
            await new Promise(r => setTimeout(r, 1500));
            this.game.switchTurn();                                      // Switch to human
            this.dice.resetDiceImage();
            this.game.dice.rollButton.disabled = false;                 // Enable human dice
        }
    }

    // === Assigns a score to a potential move for strategic choice ===
    evaluateMove(piece, destIndex) {
        const opponent = piece.color === "red" ? "blue" : "red"; // Opponent color
        let score = 0;

        const target = this.game.board.pieces[destIndex];        // Check if capture possible
        const row = Math.floor(destIndex / this.game.board.columns);

        if (target && target.color === opponent) score += 100;   // Prioritize capturing
        if (!piece.wasMoved && this.game.diceResult === 1) score += 30; // Reward starting new piece

        // Reward advancing toward enemy back row
        if (piece.color === "red") {
            score += row * 10;                                   // Further down = higher score
            if (row === this.game.board.rows - 1) score += 40;   // Extra bonus if reaches last row
        } else {
            score += (this.game.board.rows - 1 - row) * 10;      // For blue, higher row = better
            if (row === 0) score += 40;                           // Bonus for reaching top row
        }

        // Penalize moves that could be captured next turn
        if (this.isSquareThreatened(destIndex, opponent)) score -= 20;

        return score;
    }

    // === Determines if a square is threatened by opponent on next turn ===
    isSquareThreatened(destIndex, opponentColor) {
        const potentialThreats = [];
        for (let piece of this.game.board.pieces) {
            if (!piece || piece.color !== opponentColor) continue;
            const idx = this.game.board.pieces.indexOf(piece);
            for (let d = 1; d <= 6; d++) {
                this.game.diceResult = d;                      // Temporarily set dice
                const dest = this.game.getDestination(piece);
                if (dest === destIndex) potentialThreats.push(piece); // Threat detected
            }
        }
        this.game.diceResult = null;                            // Reset dice state
        return potentialThreats.length > 0;                     // True if threatened
    }
}

class ServerRequests {

    //constuctor
    constructor() {
        this.url = "http://twserver.alunos.dcc.fc.up.pt:8008/";
        this.group;
        this.nick;
        this.password;
        this.gameID;
        this.size;
    }

    // helpers
    async _post(endpoint, obj) {
        const r = await fetch(this.url + endpoint, {
            method: "POST",
            body: JSON.stringify(obj)
        });
        return r.json();
    }

    async _get(endpoint) {
        const r = await fetch(this.url + endpoint);
        return r.json();
    }

    async register(nick, password) {
        return this._post("register", { nick, password });
    }

    async join(group, nick, password, size) {
        if (!size) {
            return { error: "undefined size" };
        }
        
        const sizeNum = parseInt(size);
        if (isNaN(sizeNum) || sizeNum % 2 === 0) {
            return { error: `invalid size '${size}'` };
        }
        
        return this._post("join", { group, nick, password, size: sizeNum });
    }

    async leave(nick, password, game) {
        return this._post("leave", { nick, password, game });
    }

    async roll(nick, password, game) {
        return this._post("roll", { nick, password, game });
    }

    async pass(nick, password, game) {
        return this._post("pass", { nick, password, game });
    }

    async notify(nick, password, game, cell) {
        return this._post("notify", { nick, password, game, cell });
    }

    async update(nick, game) {
        return this._get(`update?nick=${nick}&game=${game}`);
    }

    async ranking(group, size) {
        return this._get(`ranking?group=${group}&size=${size}`);
    }
}

// === Initialize game and sidebar when DOM is ready ===
document.addEventListener("DOMContentLoaded", () => {
    const game = new Game(9, "blue");              // Default board with 9 columns, blue starts
    const sidebar = new SidebarUI(game);           // Link sidebar UI to game
    game.setModeComputer("normal");                // Set AI mode
    game.ai = new AIPlayer(game, "normal");        // Instantiate AI player

    // Initial message for default game
    game.board.showMessage("Default game started: Player (Blue) vs AI (Red). Blue starts! Start a customizable game via the sidebar.");
    
    
    // === LOGIN / REGISTER handler ===
    const server = new ServerRequests();
    const loginForm = document.querySelector(".login-container form");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nick = loginForm.querySelector('input[type="text"]').value.trim();
        const password = loginForm.querySelector('input[type="password"]').value.trim();

        if (!nick || !password) {
            alert("Nickname and password are required.");
            return;
        }

        try {
            const response = await server.register(nick, password);

            if (response.error) {
                // === Case 2: wrong password ===
                if (response.error === "User registered with a different password") {
                    alert("Registration failed: password does not match.");
                } else {
                    alert("Error: " + response.error);
                }
            } else {
                // === Empty response {} → means success or confirmation ===
                const existingUser = localStorage.getItem("lastUser_" + nick);

                if (existingUser === password) {
                    // === Case 3: password confirmation ===
                    alert("Password confirmed. Login successful!");
                } else if (existingUser === null) {
                    // === Case 1 or 4: registration succeeded ===
                    alert("Registration completed successfully!");
                }

                // Save password locally only to differentiate messages
                localStorage.setItem("lastUser_" + nick, password);

                window.currentUser = { nick, password };
                
                // Automatically fill online game fields
                const nickInput = document.getElementById("nickInput");
                const passwordInput = document.getElementById("passwordInput");
                
                if (nickInput) nickInput.value = nick;
                if (passwordInput) passwordInput.value = password;

            }

        } catch (err) {
            alert("Error communicating with the server.");
            console.error(err);
        }
    });

    // === ONLINE GAME JOIN handler ===
    const joinGameBtn = document.getElementById("joinGameBtn");
    const leaveGameBtn = document.getElementById("leaveGameBtn"); // New leave button
    const gameStatus = document.getElementById("gameStatus");
    const gameIdDisplay = document.getElementById("gameIdDisplay");
    
    // Variable to store polling interval
    let pollInterval = null;
    
    // Function to start polling for game updates
    async function startGamePolling(nick, gameId) {
        const server = new ServerRequests();
        
        // Clear any existing interval
        if (pollInterval) clearInterval(pollInterval);
        
        pollInterval = setInterval(async () => {
            try {
                const update = await server.update(nick, gameId);
                
                if (update.error) {
                    console.error("Error in update:", update.error);
                    gameStatus.innerHTML = `<p>Status: Error - ${update.error}</p>`;
                    clearInterval(pollInterval);
                    return;
                }
                
                // Check if game has a winner (game ended)
                if (update.winner !== undefined) {
                    console.log("Game ended with winner:", update.winner);
                    gameStatus.innerHTML = `<p>Status: Game ended. Winner: ${update.winner || "None"}</p>`;
                    
                    // Disable leave button since game is over
                    if (leaveGameBtn) leaveGameBtn.disabled = true;
                    
                    // Stop polling
                    clearInterval(pollInterval);
                    
                    // Show game result message
                    const messageBox = document.getElementById("message-box");
                    if (messageBox) {
                        if (update.winner === null) {
                            messageBox.textContent = "Game ended without a winner.";
                        } else if (update.winner === nick) {
                            messageBox.textContent = "Congratulations! You won!";
                        } else {
                            messageBox.textContent = `Game over. ${update.winner} wins!`;
                        }
                    }
                    
                    return;
                }
                
                // If the game has started (has pieces, players, etc.)
                if (update.pieces || update.players) {
                    console.log("Game started!", update);
                    gameStatus.innerHTML = '<p>Status: Game started!</p>';
                    
                    // Initialize local game with data from server
                    initializeGameFromServer(update);
                    
                    // Enable leave button since game is active
                    if (leaveGameBtn) leaveGameBtn.disabled = false;
                }
            } catch (error) {
                console.error("Error in polling:", error);
                clearInterval(pollInterval);
            }
        }, 2000); // Poll every 2 seconds
    }
    
    // Function to leave the current game
    async function leaveCurrentGame() {
        if (!window.currentGame) {
            alert("You are not in a game.");
            return;
        }
        
        const { nick, password, id } = window.currentGame;
        const server = new ServerRequests();
        
        try {
            if (leaveGameBtn) leaveGameBtn.disabled = true;
            leaveGameBtn.textContent = "Leaving...";
            
            const response = await server.leave(nick, password, id);
            
            if (response.error) {
                alert(`Error: ${response.error}`);
                if (leaveGameBtn) leaveGameBtn.disabled = false;
                leaveGameBtn.textContent = "Leave Game";
            } else {
                // Successfully left the game
                console.log("Left game successfully");
                gameStatus.innerHTML = '<p>Status: Left the game.</p>';
                
                // Stop polling
                if (pollInterval) {
                    clearInterval(pollInterval);
                    pollInterval = null;
                }
                
                // Reset game state
                window.currentGame = null;
                
                // Enable join button
                if (joinGameBtn) joinGameBtn.disabled = false;
                
                // Update message
                const messageBox = document.getElementById("message-box");
                if (messageBox) {
                    messageBox.textContent = "You left the game.";
                }
                
                // Reset leave button
                leaveGameBtn.textContent = "Leave Game";
                leaveGameBtn.disabled = true;
            }
        } catch (error) {
            console.error("Error leaving game:", error);
            alert("Error communicating with the server");
            if (leaveGameBtn) {
                leaveGameBtn.disabled = false;
                leaveGameBtn.textContent = "Leave Game";
            }
        }
    }
    
    // Add leave button event listener
    if (leaveGameBtn) {
        leaveGameBtn.addEventListener("click", leaveCurrentGame);
        leaveGameBtn.disabled = true; // Initially disabled
    }
    
    if (joinGameBtn) {
        joinGameBtn.addEventListener("click", async () => {
            const group = document.getElementById("groupInput").value;
            const nick = document.getElementById("nickInput").value;
            const password = document.getElementById("passwordInput").value;
            const size = document.getElementById("sizeSelect").value;
            
            if (!group || !nick || !password || !size) {
                alert("Please fill all fields!");
                return;
            }
            
            const sizeNum = parseInt(size);
            if (sizeNum % 2 === 0 || sizeNum < 7 || sizeNum > 15) {
                alert("Board size must be an odd number between 7 and 15!");
                return;
            }
            
            const server = new ServerRequests();
            
            try {
                joinGameBtn.disabled = true;
                joinGameBtn.textContent = "Joining...";
                gameStatus.innerHTML = '<p>Status: Joining game with size ' + size + '...</p>';
                
                const response = await server.join(group, nick, password, size);
                
                if (response.error) {
                    gameStatus.innerHTML = `<p>Status: Error - ${response.error}</p>`;
                    alert(`Error: ${response.error}`);
                } else if (response.game) {
                    gameStatus.innerHTML = `<p>Status: Joined! Waiting for opponent with same board size (${size})...</p>`;
                    gameIdDisplay.textContent = `Game ID: ${response.game}`;
                    
                    // Save game information with the REQUESTED size
                    window.currentGame = {
                        id: response.game,
                        group: group,
                        nick: nick,
                        password: password,
                        requestedSize: sizeNum,  // Store what we requested
                        size: sizeNum  // Initially same, will be validated later
                    };
                    
                    // Enable leave button
                    if (leaveGameBtn) {
                        leaveGameBtn.disabled = false;
                        leaveGameBtn.textContent = "Leave Game";
                    }
                    
                    // Start polling for updates
                    startGamePolling(nick, response.game);
                }
            } catch (error) {
                console.error("Error in join:", error);
                gameStatus.innerHTML = '<p>Status: Connection error</p>';
                alert("Error communicating with the server");
            } finally {
                joinGameBtn.disabled = false;
                joinGameBtn.textContent = "Join Online Game";
            }
        });
    }
    
    // Function to initialize game from server data
    function initializeGameFromServer(gameData) {
        console.log("Initializing game with data:", gameData);
        
        // Check if we have valid game data
        if (!gameData.pieces || !Array.isArray(gameData.pieces)) {
            console.error("Invalid game data from server");
            gameStatus.innerHTML = '<p>Status: Error - Invalid game data</p>';
            return;
        }
        
        // Calculate board size from pieces array
        const totalCells = gameData.pieces.length;
        const calculatedSize = totalCells / 4; // 4 rows
        
        // actual verification
        if (window.currentGame && window.currentGame.size !== calculatedSize) {
            console.error(`Error: Requested size ${window.currentGame.size} but server paired with size ${calculatedSize}.`);
            
            // Update status
            gameStatus.innerHTML = `<p>Status: Error - Wrong board size (you: ${window.currentGame.size}, server: ${calculatedSize})</p>`;
            
            // Show error message
            const messageBox = document.getElementById("message-box");
            if (messageBox) {
                messageBox.textContent = `Error: You requested ${window.currentGame.size} columns but were paired with ${calculatedSize} columns. Leaving game.`;
            }
            
            // Automatically leave the game because it's not what the player wanted
            setTimeout(() => {
                leaveCurrentGame();
            }, 2000);
            
            return; 
        }
        
        
        // Update board with the calculated size 
        game.board.newBoard(calculatedSize, "blue");
        
        // Determine player color
        const myNick = window.currentGame ? window.currentGame.nick : null;
        let myColor = "blue";
        
        if (myNick && gameData.players && gameData.players[myNick]) {
            myColor = gameData.players[myNick];
        }
        
        // Clear and reposition pieces
        game.board.pieces.fill(null);
        
        // Place pieces from server data
        gameData.pieces.forEach((pieceInfo, index) => {
            if (pieceInfo && pieceInfo.color) {
                const piece = new Piece(pieceInfo.color);
                
                if (pieceInfo.moved) piece.firstmove();
                if (pieceInfo.final) piece.reachedLastRow();
                
                game.board.pieces[index] = piece;
            }
        });
        
        game.board.showPieces();
        
        // Set current player
        if (gameData.turn) {
            game.board.currentPlayer = gameData.turn;
        }
        
        // Update UI orientation
        if (myColor === "red") {
            game.board.boardElement.classList.add("flipped");
        } else {
            game.board.boardElement.classList.remove("flipped");
        }
        
        // Update message
        const messageBox = document.getElementById("message-box");
        if (messageBox) {
            const opponentNick = Object.keys(gameData.players || {}).find(nick => nick !== myNick);
            messageBox.textContent = `Online game started! Board: ${calculatedSize} columns. You are ${myColor}.`;
        }
        
        // Update status
        gameStatus.innerHTML = '<p>Status: Game started!</p>';
    }
});
