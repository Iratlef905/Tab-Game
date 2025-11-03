// === Class representing a single game piece (red or blue) ===
class Piece {
    constructor(color) {
        this.color = color;                               // Stores the color of the piece ("red" or "blue")
        this.wasMoved = false;                               // Tracks whether the piece has moved yet
        this.wasAlreadyInLastRow = false;                           // Indicates if the piece has reached the final row
        this.domElement = document.createElement("div");  // Creates the visual DOM element for the piece
        this.domElement.classList.add("piece", this.color); // Applies base "piece" class and color-specific styling
    }

    // === Marks that the piece has made its first move ===
    firstmove() {
        this.wasMoved = true;                                // Updates the state to indicate movement
        this.domElement.classList.add("moved"); // aplies 75% opacity
    }

    // === Marks that the piece has reached the last row ===
    reachedLastRow() {
        this.wasAlreadyInLastRow = true;                            // Updates the state to indicate the final position
        this.domElement.classList.add("final"); // aplies 100%  opacity
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

        // = ADDED --> and  <-- to each place on the board
        const cells = this.boardElement.querySelectorAll('.cell');
        cells.forEach((cell, i) => {
            const row = Math.floor(i / this.columns);
            const arrow = document.createElement('span');
            arrow.classList.add('arrow');
            // adds an arrow to the cell, depending on the direction the pieces move in that line (-> for odd and <- for even)
            arrow.textContent = row % 2 === 0 ? '←' : '→';
            cell.appendChild(arrow);
        })

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
        this.rollButton.disabled = true;                       // Disable roll button to prevent multiple rolling
        this.result = this.rollWeightedDice();                 // Get weighted result
        this.updateDiceImage();                                // Update dice face in UI

        let steps = this.result === 0 ? 6 : this.result;       // Treat 0 as 6 for movement

        if (this.onRoll) this.onRoll(steps);                   // Call game callback with steps
    }

    // === Updates the dice image to match the last result ===
    updateDiceImage() {
        if (this.diceImage) {
            this.diceImage.src = `images/dice_${this.result}.png`; // Set dice image source


        }
    }

    // == Function to reset image after player clicks on dice ==
    resetDiceImage() {
        if (this.diceImage) {
            this.diceImage.src = "images/initial_dice.png"; // ← ou o nome da tua imagem inicial
        }
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
        this.dice.rollButton.disabled = false;                         // Enables the roll dice button
        this.board.showMessage(`Player ${this.board.currentPlayer} starts! Roll the dice.`); // Initial message
        // === NEW: Skip Turn Button ===
        this.skipTurnButton = document.getElementById("skipTurnBtn");
        if (this.skipTurnButton) {
            this.skipTurnButton.addEventListener("click", () => this.skipTurn());
            this.skipTurnButton.disabled = true; // initially disabled
        }
    }

    // === Handles dice result and determines if extra move is allowed ===
    onDiceRolled(result) {
        this.diceResult = result;                                      // Save dice result

        if (result === 1 || result === 4 || result === 6) {
            this.extraMove = true;                                     // Player gets an extra move
            this.board.showMessage(`Player ${this.board.currentPlayer} rolled ${result}. Move a piece and then roll again!`);
        } else if (result === 2 || result === 3) {
            this.extraMove = false;                                    // Turn ends after next move
            this.board.showMessage(`Player ${this.board.currentPlayer} rolled ${result}. Move a piece, then turn ends.`);
        }

        // Check if there are any available moves
        const movesAvailable = this.hasAvailableMoves();

        if (!movesAvailable && this.extraMove) {
            // No moves possible, but player can roll again
            this.board.showMessage(`Player ${this.board.currentPlayer} rolled ${result} but has no moves. Roll again!`);
            this.dice.rollButton.disabled = false;  // Enable roll button for another turn
            this.disablePieceClicks();               // No pieces to click
            this.skipTurnButton.disabled = true;     // Skip button stays disabled
        } else if (!movesAvailable && !this.extraMove) {
            // No moves and no extra roll → allow skip turn
            this.board.showMessage(`Player ${this.board.currentPlayer} has no possible moves. Click "Skip Turn" to continue the game.`);
            this.skipTurnButton.disabled = false;
            this.disablePieceClicks();
        } else {
            // Moves available → enable piece clicks
            this.enablePieceClicks();
            this.skipTurnButton.disabled = true;
        }
        if (this.ai && this.board.currentPlayer === "red") {
            setTimeout(() => this.ai.makeMove(), 1000);
        }
    }

    // === Checks if the current player has any possible move ===
    hasAvailableMoves() {
        const playerColor = this.board.currentPlayer;
        return this.board.pieces.some(piece => {
            if (!piece || piece.color !== playerColor) return false;
            if (!piece.wasMoved && this.diceResult !== 1) return false;
            if (this.isBlockedByStartRow(piece)) return false;

            const choices = this.decidingPoint(piece);
            if (choices && Array.isArray(choices)) {
                return choices.some(idx => {
                    if (idx == null) return false;
                    const targetPiece = this.board.pieces[idx];
                    return !targetPiece || targetPiece.color !== playerColor;
                });
            }
            const destination = this.getDestination(piece);
            const targetPiece = this.board.pieces[destination];
            return !targetPiece || targetPiece.color !== playerColor;
        });
    }

    // === Allows player to skip their turn if no moves are available ===
    skipTurn() {
        this.skipTurnButton.disabled = true;  // Disable button again
        this.diceResult = null;               // Reset dice
        this.disablePieceClicks();            // Disable piece interactions
        this.switchTurn();                    // Switch to the other player
        this.dice.rollButton.disabled = false;
        this.dice.resetDiceImage();
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
        
        if (piece.color !== this.board.currentPlayer) {              // Check piece belongs to current player
            this.board.showMessage("You can't move pieces of the opponent!");
            return;
        }

        if (this.diceResult === null) {                              // Ensure dice has been rolled
            this.board.showMessage("Roll the dice first!");
            return;
        }

        if(!piece.wasMoved && this.diceResult !== 1){
            this.board.showMessage("You can only make the first move of a piece after rolling a 1!");
            return;
        }

        if (this.isBlockedByStartRow(piece)) {
            this.board.showMessage("You cannot move pieces in the last row while you have pieces in the start row.");
            return;
        }

        if(!piece.wasMoved) {
            piece.firstmove();
        }

        let destination = this.getDestination(piece);                // Calculate target cell index

        let choices = this.decidingPoint(piece);                   // Check if piece is at a decision point

        if (choices && choices[0] != null && choices[1] === null){
            if(this.board.pieces[choices[0]] && this.board.pieces[choices[0]].color === this.board.currentPlayer) {
                this.board.showMessage("You can't move onto your own piece!");
                return;
            }
            destination = choices[0];
        }

        if (choices && choices[1] != null) {
            if((this.board.pieces[choices[0]] && this.board.pieces[choices[0]].color === this.board.currentPlayer) 
                && (this.board.pieces[choices[1]] && this.board.pieces[choices[1]].color === this.board.currentPlayer)) {
                this.board.showMessage("You can't move onto your own piece!");
                return;
            }
            if(choices[1] && this.board.pieces[choices[0]] && this.board.pieces[choices[0]].color === this.board.currentPlayer) {
                choices = [choices[1]];
            } 
            if(choices[1] && this.board.pieces[choices[1]] && this.board.pieces[choices[1]].color === this.board.currentPlayer) {
                choices = [choices[0]];
            }

            const chosenIndex = await this.waitForChoice(choices);
            this.disableHighlights();
            destination = chosenIndex;
        }

        const targetPiece = this.board.pieces[destination];          // Check if target cell is occupied
        if (targetPiece && targetPiece.color !== this.board.currentPlayer) {
            targetPiece.domElement.remove();                         // Remove opponent piece
        } else if (targetPiece && targetPiece.color === this.board.currentPlayer) {
            this.board.showMessage("You can't move onto your own piece!");
            return;
        }

        this.movePieceForward(piece, destination);               // Move piece normally

        this.disablePieceClicks();                                   // Disable further clicks until next turn

        this.dice.resetDiceImage();

        if (!this.checkWinCondition()) return;                       // Check if the game is over

        // Determine if turn ends or player rolls again
        if (this.diceResult === 2 || this.diceResult === 3) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Small pause before switching turn
            this.switchTurn();
            this.diceResult = null;
            this.dice.rollButton.disabled = false;
            this.board.showMessage(`Player ${this.board.currentPlayer}'s turn! Roll the dice.`);
        } else if (this.extraMove) {
            this.diceResult = null;                                   // Reset dice for extra move
            this.dice.rollButton.disabled = false;
            this.board.showMessage(`Player ${this.board.currentPlayer} can roll again!`);
        }
    }

    // === Checks if a piece is blocked because other pieces are in start row ===
    isBlockedByStartRow(piece) {
        const playerColor = piece.color;
        const startRow = playerColor === "blue" ? 3 : 0;  
        const lastRow = playerColor === "blue" ? 0 : 3; 

        const index = this.board.pieces.indexOf(piece);
        const row = Math.floor(index / this.board.columns);
        if (row !== lastRow) return false;

        const hasStartRowPieces = this.board.pieces.some((p, idx) => {
            if (!p || p.color !== playerColor) return false;
            const r = Math.floor(idx / this.board.columns);
            return r === startRow;
        });

        return hasStartRowPieces;
    }

    // === Determines if a piece is at a decision point and returns alternative destinations ===
    decidingPoint(piece) {
        const index = this.board.pieces.indexOf(piece);             // Find the piece's index
        if (index === -1) return null;

        const row = Math.floor(index / this.board.columns);         // Compute current row
        const destination = this.getDestination(piece);             // Compute normal destination

        // --- Blue decision logic: from row 1 to 0, give two possible destinations ---
        if (piece.color === "blue" && row === 1 && Math.floor(destination / this.board.columns) === 0) {
            if (piece.wasAlreadyInLastRow) return [destination + 2 * this.board.columns, null];   //if piece was in last row already return only the destination a row back
            return [destination, destination + 2 * this.board.columns]; // Original + alternative path
        }

        // --- Red decision logic: from row 2 to 3, give two possible destinations ---
        if (piece.color === "red" && row === 2 && Math.floor(destination / this.board.columns) === 3) {
            if (piece.wasAlreadyInLastRow) return [destination - 2 * this.board.columns, null];   //if piece was in last row already return only the destination a row back
            return [destination, destination - 2 * this.board.columns]; // Original + alternative path
        }

        return null;                                                // No decision point
    }

    waitForChoice(choices) {
        return new Promise((resolve) => {
            choices.forEach(idx => {
                const cell = this.board.cells[Math.floor(idx / this.board.columns)][idx % this.board.columns];
                cell.classList.add("highlight");
                this.board.showMessage("Please choose one of the highlighted options to move");
                cell.onclick = () => {
                    resolve(idx);
                };
            });
        });
    }

    // === Checks if either player has won the game and updates scoreboard ===
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
            this.updateScoreboard("blue");
            return false;
        } else if (!hasBlue) {                                     // Red wins
            this.board.showMessage("Red wins!");
            this.updateScoreboard("red");
            return false;
        }

        return true; // Game continues
    }
    

    // ============== NEW CODE FOR UPDATING THE SCOREBOARD =============== //
    // === Updates the scoreboard based on the winner ===
    updateScoreboard(winner) {
        const scoreboard = document.querySelector(".scoreboard table tbody");
        if (!scoreboard) return;

        // finc each players points
        const rows = scoreboard.querySelectorAll("tr");
        const blue_p = rows[0];
        const red_p = rows[1];

        // increment the "Best Result" count
        if (winner === "blue") {
            const cell = blue_p.querySelectorAll("td")[1];
            let current = parseInt(cell.textContent) || 0;
            cell.textContent = current + 1; // updates
        } else if (winner === "red") {
            const cell = red_p.querySelectorAll("td")[1];
            let current = parseInt(cell.textContent) || 0;
            cell.textContent = current + 1; // updates
        }
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

        // because piece has reached final row changes opacity to 100%
        if ((piece.color === "blue" && row === 0) ||
            (piece.color === "red" && row === this.board.rows - 1)){
                piece.reachedLastRow();
            }


        this.board.pieces[index] = null;                           // Remove piece from old position
        this.board.pieces[destination] = piece;                    // Place piece in new position

        const cell = this.board.cells[row][col];
        piece.animate(cell); // Update DOM
    }

    // === Removes all highlights and click handlers from decision cells ===
    disableHighlights() {
        this.board.cells.flat().forEach(cell => {
            cell.classList.remove("highlight");                   // Remove highlight class
            cell.onclick = null;                                   // Disable onclick
        });
    }

    // === Switches current player and optionally flips the board visually ===
    switchTurn() {
        this.board.currentPlayer = this.board.currentPlayer === "blue" ? "red" : "blue";
    
        if (!this.ai) {
            if (this.board.currentPlayer === "red") {
                this.board.boardElement.classList.add("flipped");
            } else {
                this.board.boardElement.classList.remove("flipped");
            }
        }   
    
        this.board.showMessage(`Player ${this.board.currentPlayer}'s turn! Roll the dice.`);
    
        // ✅ AI auto-rolls if it's its turn
        if (this.ai && this.board.currentPlayer === "red") {
            this.dice.rollButton.disabled = true; // Disable human roll
            setTimeout(() => this.dice.rollDice(), 1500); // AI rolls automatically
        } else {
            this.dice.rollButton.disabled = false; // Enable for human
        }
    }
    
    //Start New Game Button helper functions
    setModePlayer() {
        delete this.aiDifficulty;
        if (this.dice?.rollButton) this.dice.rollButton.disabled = false;
    }

    setModeComputer(difficulty) {
        this.aiDifficulty = difficulty || "normal";
        if (this.dice?.rollButton) this.dice.rollButton.disabled = false;
        // Future AI logic can go here
    }
}


// ================== SIDEBAR UI CONTROLLER ==================
class SidebarUI {
    constructor(gameInstance) {
        this.game = gameInstance; // Link to your Game object

        // Cache sidebar elements
        this.startGameBtn = document.getElementById("startGameBtn");
        this.opponentSelect = document.getElementById("opponentSelect");
        this.difficultySelect = document.getElementById("difficultySelect");
        this.columnsSelect = document.getElementById("columnsSelect");
        this.startingPlayerSelect = document.getElementById("StartingPlayerSelect");
        this.giveUpBtn = document.getElementById("giveUpBtn");

        // Initialize event listeners
        this.initializeEvents();
    }

    initializeEvents() {
        // Enable/disable difficulty dropdown based on opponent
        if (this.opponentSelect && this.difficultySelect) {
            this.opponentSelect.addEventListener("change", () => {
                this.difficultySelect.disabled = this.opponentSelect.value !== "computer";
            });
            // Set initial state
            this.difficultySelect.disabled = this.opponentSelect.value !== "computer";
        }

        // Handle "Start Game" button
        if (this.startGameBtn) {
            this.startGameBtn.addEventListener("click", () => this.startGame());
        }
        
        if (this.giveUpBtn) {
            this.giveUpBtn.addEventListener("click", () => this.giveUp());
        }
    }

    startGame() {
        const opponent = this.opponentSelect.value;
        const difficulty = this.difficultySelect.value;
        const columns = parseInt(this.columnsSelect.value);
        const startingPlayer = this.startingPlayerSelect.value;
    
        this.game.board.newBoard(columns, startingPlayer);
        this.game.board.currentPlayer = startingPlayer;
        this.game.dice.rollButton.disabled = false;
    
        if (opponent !== "computer") {
            if (startingPlayer === "red") {
                this.game.board.boardElement.classList.add("flipped");
            } else {
                this.game.board.boardElement.classList.remove("flipped");
            }
        } else {
            this.game.board.boardElement.classList.remove("flipped");
            console.log("start game in sidebar: ", this.game.ai);
        }
    
        const messageBox = document.getElementById("message-box");
        messageBox.textContent = `New game started against ${opponent}${
            opponent === "computer" ? " (" + difficulty + " difficulty)" : ""
        } on a ${columns}-column board. ${startingPlayer} starts!`;
    
        if (opponent === "computer") {
            this.game.ai = new AIPlayer(this.game, difficulty);
        } else {
            this.game.ai = null;
        }
        if (this.game.ai && this.game.board.currentPlayer === "red") {
            console.log("detected");
            this.game.dice.rollButton.disabled = true; // Disable human roll
            setTimeout(() => this.game.dice.rollDice(), 1500); // AI rolls automatically
        } else {
            this.game.dice.rollButton.disabled = false; // Enable for human
        }
    }
    
    giveUp() {
        const currentPlayer = this.game.board.currentPlayer;
        const winner = currentPlayer === "blue" ? "red" : "blue";
    
        // Announce the winner
        this.game.board.showMessage(`${currentPlayer} gave up! ${winner} wins!`);
    
        // Update scoreboard
        this.game.updateScoreboard(winner);
    
        // Disable current interactions
        this.game.disablePieceClicks();
        if (this.game.dice?.rollButton) this.game.dice.rollButton.disabled = true;
        if (this.game.skipTurnButton) this.game.skipTurnButton.disabled = true;
    
        // Automatically start a new game after pause (1s)
        setTimeout(() => {
            const opponent = this.opponentSelect.value;
            const difficulty = this.difficultySelect.value;
            const columns = parseInt(this.columnsSelect.value);
            const startingPlayer = winner; 
    
            // Reset board and start a new match
            this.game.board.newBoard(columns, startingPlayer);
            this.game.board.currentPlayer = startingPlayer;
    
            // Flip the board if red starts
            if (startingPlayer === "red") {
                this.game.board.boardElement.classList.add("flipped");
            } else {
                this.game.board.boardElement.classList.remove("flipped");
            }
    
            const messageBox = document.getElementById("message-box");
            messageBox.textContent = `New game started automatically after ${currentPlayer} gave up. ${startingPlayer} starts!`;
    
            this.game.dice.rollButton.disabled = false;
        }, 1000);
    }
}    


// === AI MOVE EVALUATION AND EXECUTION ===
class AIPlayer {
    constructor(game, difficulty = "normal") {
        this.game = game;
        this.difficulty = difficulty;
    }

    async makeMove() {
        const playerColor = this.game.board.currentPlayer;
        const dice = this.game.diceResult;
        let actionMessage = `Red (AI) rolled ${dice}. `;
    
        // Find all possible moves
        const possibleMoves = [];
        this.game.board.pieces.forEach((piece, index) => {
            if (!piece || piece.color !== playerColor) return;
            if (!piece.wasMoved && dice !== 1) return;
            // Skip move if piece is blocked by start-row rule
            if (this.game.isBlockedByStartRow(piece)) return;

            const dest = this.game.getDestination(piece);
            if (dest == null) return;
    
            const target = this.game.board.pieces[dest];
            if (target && target.color === playerColor) return;
    
            const score = this.evaluateMove(piece, dest);
            possibleMoves.push({ piece, dest, score, target });
        });
    

        if (possibleMoves.length === 0) {
            if ([1,4,6].includes(dice)) {
                await new Promise(r => setTimeout(r, 2000));
                this.game.dice.rollDice(); 
            } else {
                await new Promise(r => setTimeout(r, 2000));
                this.game.skipTurn(true);
            }
            return;
        }
    
        // Choose best move or random (based on difficulty)
        let chosenMove;
        if (this.difficulty === "normal") {
            chosenMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        } else {
            chosenMove = possibleMoves.reduce((best, m) => m.score > best.score ? m : best);
        }
    
        await new Promise(r => setTimeout(r, 1500)); // Pause for realism
        if (!chosenMove.piece.wasMoved) chosenMove.piece.firstmove();
    
        // If capture, remove target before move
        if (chosenMove.target && chosenMove.target.color !== playerColor) {
            chosenMove.target.domElement.remove();
            actionMessage += `Captured a ${chosenMove.target.color} piece. `;
        } else {
            actionMessage += "Moved a piece forward. ";
        }
    
        this.game.movePieceForward(chosenMove.piece, chosenMove.dest);
        this.game.disablePieceClicks();

        const gameContinues = this.game.checkWinCondition();
        if (!gameContinues) return; // stop AI immediately if game ended
    
        // Determine if AI rolls again or turn switches
        if (dice === 1 || dice === 4 || dice === 6) {
            actionMessage += "Gets another roll!";
            this.game.board.showMessage(actionMessage);
            await new Promise(r => setTimeout(r, 1500));
            this.game.dice.rollDice();
        } else {
            actionMessage += "Turn ends.";
            this.game.board.showMessage(actionMessage);
            await new Promise(r => setTimeout(r, 1500));
            this.game.switchTurn();
            this.dice.resetDiceImage();
            this.game.dice.rollButton.disabled = false;
        }
    }

    evaluateMove(piece, destIndex) {
        const opponent = piece.color === "red" ? "blue" : "red";
        let score = 0;

        const target = this.game.board.pieces[destIndex];
        const row = Math.floor(destIndex / this.game.board.columns);

        // CaptureValue
        if (target && target.color === opponent) score += 100;

        // NewPiece
        if (!piece.wasMoved && this.game.diceResult === 1) score += 30;

        // Closer to enemy back row
        if (piece.color === "red") {
            score += row * 10; // further down = better
            if (row === this.game.board.rows - 1) score += 40;
        } else {
            score += (this.game.board.rows - 1 - row) * 10; // further up = better
            if (row === 0) score += 40;
        }

        // SafetyPenalty, if enemy could capture next turn
        const danger = this.isSquareThreatened(destIndex, opponent);
        if (danger) score -= 20;

        return score;
    }

    // Rough heuristic: if opponent could move into this square next turn
    isSquareThreatened(destIndex, opponentColor) {
        const potentialThreats = [];
        for (let piece of this.game.board.pieces) {
            if (!piece || piece.color !== opponentColor) continue;
            const idx = this.game.board.pieces.indexOf(piece);
            for (let d = 1; d <= 6; d++) {
                this.game.diceResult = d;
                const dest = this.game.getDestination(piece);
                if (dest === destIndex) potentialThreats.push(piece);
            }
        }
        this.game.diceResult = null; 
        return potentialThreats.length > 0;
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const game = new Game(7, "blue");

    const sidebar = new SidebarUI(game);

    game.setModeComputer("normal");
    game.ai = new AIPlayer(game, "normal"); 

    game.board.showMessage("Default game started: Player (Blue) vs AI (Red). Blue starts! Start customizable game via sidebar.");
});