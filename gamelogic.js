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
        this.resolveMessageColor = null;                      // Optional resolver for message color
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
                } else if (row === this.rows - 1){            // Bottom row: initialize blue pieces
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
            const movesRight = (row % 2) === 1;                     // Row 0/2 left, row 1/3 right
            arrow.classList.add('arrow', movesRight ? 'right' : 'left');
            arrow.textContent = movesRight ? '\u2192' : '\u2190';   // Visual arrows for row direction
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
    showMessage(text, colorOverride){
        const messageBox = document.getElementById("message-box");  // Get DOM element for messages
        if (!messageBox) return;
        messageBox.textContent = text;                              // Set displayed text to provided string
        // Colorize by current player for quick visual distinction
        messageBox.classList.remove("neon-blue", "neon-red");
        if (colorOverride === "neutral") return;
        const color = colorOverride || (this.resolveMessageColor ? this.resolveMessageColor() : this.currentPlayer);
        if (color === "blue") {
            messageBox.classList.add("neon-blue");
        } else if (color === "red") {
            messageBox.classList.add("neon-red");
        }
    }
}

// === Class representing a weighted dice with UI integration ===
class Dice {
        // === Initializes Dice with roll button, dice image, and callback ===
        constructor(onRoll) {
            this.rollButton = document.getElementById("rollDiceBtn"); // Reference to the button DOM element
            this.diceImage = document.getElementById("dice-image");   // Reference to the dice image DOM element
        this.diceValueText = document.getElementById("diceValueText"); // Textual indicator for dice value

        this.result = null;                                      // Stores last rolled value
        this.onRoll = onRoll;                                    // Callback function triggered after dice roll

        this.isOnline = false;
        this.serverRequests = null;
        this._rolling = false;                                   // Prevent duplicate/in-flight rolls
        this.gameRef = null;                                     // Optional back-reference to Game

        if (this.rollButton) {
            this.rollButton.addEventListener("pointerdown", () => {
                
            });

            this.rollButton.addEventListener("click", () => {
                this.rollDice();
            }); // Attach click listener to roll dice
        }
    }

    enableOnlineMode(serverRequests) {
        this.isOnline = true;
        this.serverRequests = serverRequests;
    }

    updateFromServer(value) {
        this.result = value;

        this.updateDiceImage(); 
        this.updateDiceLabel();
        enableRollButton(this.rollButton);

        let steps = value === 0 ? 6 : value;
        if (this.onRoll) this.onRoll(steps); 
    }

    // === Rolls the dice using a weighted probability distribution ===
    rollWeightedDice() {
        const probabilities = [0.06, 0.25, 0.38, 0.25, 0.06];  // Probabilities for values 0ā€“4 (weighted)
        const random = Math.random();                           // Generate random number 0ā€“1
        let cumulative = 0;                                     // Cumulative probability tracker

        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];                     // Increment cumulative probability
            if (random < cumulative) return i;                  // Return current value if random falls within interval
        }
        return probabilities.length - 1;                        // Fallback: return last index
    }

    // === Rolls dice, updates image, message, and calls callback ===
    async rollDice() {
        if (this.gameRef) {
            this.gameRef.forceRollReady = false;                 // Clear force-ready state when a roll starts
            this.gameRef.stopRollEnforcer();
        }
        this._rolling = true;
        this.rollButton.disabled = true;                        // Prevent multiple clicks while rolling
        if(!this.isOnline){
            this.result = this.rollWeightedDice();                 // Generate weighted dice result
            this.updateDiceImage();                                 // Update dice image to match result

            let steps = this.result === 0 ? 6 : this.result;       // Treat 0 as 6 for movement logic

            if (this.onRoll) this.onRoll(steps);                   // Call provided callback with steps
            this._rolling = false;
        }else{
            console.log("Rolling via server...");

            this.rollButton.disabled = true;

            try {
                const res = await this.serverRequests.roll(
                    this.serverRequests.nick,
                    this.serverRequests.password,
                    this.serverRequests.gameID
                );
                if (res && res.error) {
                    console.error("Server roll rejected:", res.error);
                    const msg = document.getElementById("message-box");
                    if (msg) msg.textContent = `Cannot roll now: ${res.error}`;
                    enableRollButton(this.rollButton); // allow retry
                    this._rolling = false;
                    return;
                }
            } catch (err) {
                console.error("Roll request failed:", err);
                const msg = document.getElementById("message-box");
                if (msg) msg.textContent = "Roll failed. Please try again.";
                enableRollButton(this.rollButton);
                this._rolling = false;
                return;
            }
            // Keep disabled; server update will re-enable when appropriate
            this._rolling = false;
            return;
        }
    }

    // === Updates the dice image according to last rolled value ===
    updateDiceImage() {
        if (this.diceImage) {
            const imgIndex = this.result === 6 ? 0 : this.result; // Show 0 image when value is 6
            this.diceImage.src = `images/dice_${imgIndex}.png`;   // Update image source to match dice value
        }
        this.updateDiceLabel();
    }

    updateDiceLabel() {
        if (this.diceValueText) {
            if (this.result === null || this.result === undefined) {
                this.diceValueText.textContent = "-";
            } else {
                const shown = this.result === 0 ? 6 : this.result;
                this.diceValueText.textContent = `Roll: ${shown}`;
            }
        }
    }

    // === Resets dice image to initial state (used after player action) ===
    resetDiceImage() {
        if (this.diceImage) {
            this.diceImage.src = "images/initial_dice.png";    // Reset to default initial dice image
        }
    }
}

// === Helper to remap indices between local (flipped) and server perspective ===
function mapLocalIndexToServer(idx, rows, cols, initialColor, respectInitialColor = true) {
    const row = Math.floor(idx / cols);
    let col = idx % cols;
    // Serpentine mapping: even rows (0-based) run right→left, odd rows left→right
    if (row % 2 === 0) {
        col = cols - 1 - col;
    }
    return row * cols + col;
}

function mapServerIndexToLocal(idx, rows, cols, initialColor, respectInitialColor = true) {
    const row = Math.floor(idx / cols);
    let col = idx % cols;
    // Serpentine mapping inverse: even rows are mirrored
    if (row % 2 === 0) {
        col = cols - 1 - col;
    }
    return row * cols + col;
}

// Track the last known group/size (for ranking), even after leaving a game
let lastGroup = "99";
let lastSize = 9;

// === Ranking helpers ===
function getRankingParams() {
    const groupInput = document.getElementById("groupInput");
    const sizeSelect = document.getElementById("sizeSelect") || document.getElementById("columnsSelect");
    const current = window.currentGame;
    const groupRaw = (current?.group) || (groupInput?.value) || lastGroup || "99";
    const sizeRaw = (current?.size) || (current?.requestedSize) || (sizeSelect?.value) || lastSize || 9;
    const sizeNum = parseInt(sizeRaw, 10);
    const group = `${groupRaw}` || "99";
    const size = isNaN(sizeNum) ? (lastSize || 9) : sizeNum;
    // Persist last seen values for future ranking fetches
    lastGroup = group;
    lastSize = size;
    return { group, size };
}

async function fetchAndRenderRanking() {
    const tbody = document.getElementById("scoreboard-body") || document.querySelector(".scoreboard table tbody");
    if (!tbody) return;

    const { group, size } = getRankingParams();
    const groupNum = parseInt(group, 10);
    const sizeNum = parseInt(size, 10);
    if (isNaN(groupNum) || isNaN(sizeNum)) {
        tbody.innerHTML = `<tr><td colspan="4">Set group and size to load ranking.</td></tr>`;
        return;
    }

    const server = new ServerRequests();

    tbody.innerHTML = `<tr><td colspan="4">Loading ranking...</td></tr>`;
    try {
        const res = await server.ranking(groupNum, sizeNum);
        if (res?.error) {
            tbody.innerHTML = `<tr><td colspan="4">Ranking error: ${res.error}</td></tr>`;
            return;
        }

        const listRaw = Array.isArray(res?.ranking) ? res.ranking : [];
        const sorted = listRaw
            .map((entry, idx) => {
                const nick = entry.nick || entry.player || entry.name || `Player ${idx + 1}`;
                // Usa victories (conforme especificação) com fallback para wins
                const victories = entry.victories ?? entry.wins ?? 0;
                const games = entry.games ?? 0;
                return { nick, victories, games };
            })
            .sort((a, b) => {
                // Ordena por vitórias decrescentes
                if (b.victories !== a.victories) return b.victories - a.victories;
                // Em caso de empate, ordena por menor número de jogos (maior eficiência)
                if (a.games !== b.games) return a.games - b.games;
                // Se ainda empatar, ordena alfabeticamente
                return a.nick.localeCompare(b.nick);
            })
            .slice(0, 10);

        if (!sorted.length) {
            tbody.innerHTML = `<tr><td colspan="4">No ranking data.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        sorted.forEach((entry, idx) => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${idx + 1}</td><td>${entry.nick}</td><td>${entry.victories}</td><td>${entry.games}</td>`;
            tbody.appendChild(row);
        });
    } catch (err) {
        console.error("Failed to load ranking", err);
        tbody.innerHTML = `<tr><td colspan="4">Ranking unavailable</td></tr>`;
    }
}

// === Helper to fully enable the roll button (removes HTML disabled attribute) ===
function enableRollButton(button) {
    if (!button) return;
    button.disabled = false;
    button.removeAttribute("disabled");
    button.style.pointerEvents = "auto";
}

// === Class representing game logic and turn management ===
class Game {
    // === Initializes the game with board, dice, starting player, and UI elements ===
    constructor(rows, playerColor){
        this.board = new Board(rows, playerColor);                     // Create Board instance
        this.board.resolveMessageColor = () => this.playerColor || this.board.currentPlayer; // Use local player color if known
        this.dice = new Dice((result) => this.onDiceRolled(result));   // Create Dice instance with callback
        this.dice.gameRef = this;                                      // Let the dice know the owning game
        this.diceResult = null;                                        // Store last dice result
        this.isServerGame = false;
        this.serverRequests = null;
        this.turnNick = null;                                          // Tracks whose turn it is (nick) in online games
        this.playerColor = playerColor || null;                        // Local player perspective color (if known)
        this.extraMove = false;                                        // Tracks if player gets an extra move
        this.forceRollReady = false;                                   // When true, keep roll button enabled regardless of turn flicker
        this.rollEnforcer = null;                                      // Interval that keeps roll button enabled when forced
        this.serverInitialColor = null;                                // Color of the server-declared starting player
        this.hasServerSync = false;                                    // Tracks if board was synced from server
        this.serverStep = null;                                        // Latest server-declared step ("from","to",...)
        this.serverSelected = null;                                    // Latest server-selected indices
        this.homeRows = { red: 0, blue: this.board.rows - 1 };         // Track which side each color starts on
        this.updateHomeRows(true);                                     // Derive orientation from current piece layout
        enableRollButton(this.dice.rollButton);                        // Enable dice roll button initially
        this.board.showMessage(`Player ${this.board.currentPlayer} starts! Roll the dice.`); // Initial message
        this.applyPerspective();                                       // Orient board based on local perspective

        // === Skip Turn button setup ===
        this.skipTurnButton = document.getElementById("skipTurnBtn");  // Reference to skip button
        if (this.skipTurnButton) {
            this.skipTurnButton.addEventListener("click", () => {
                if (this.isServerGame) {
                    if (this.extraMove && this.diceResult === null) {
                        this.board.showMessage("You must roll again before passing.");
                        this.skipTurnButton.disabled = true;
                        enableRollButton(this.dice.rollButton);
                        return;
                    }
                    this.skipTurnOnline();
                } else {
                    this.skipTurn();
                    this.skipTurnButton.disabled = true;                        // Initially disabled until needed
                }
            });
        }
    }

    // Keep roll button enabled repeatedly while forceRollReady is on
    startRollEnforcer() {
        if (this.rollEnforcer) clearInterval(this.rollEnforcer);
        this.rollEnforcer = setInterval(() => {
            enableRollButton(this.dice?.rollButton);
            if (this.dice) this.dice._rolling = false;
        }, 80);
    }

    stopRollEnforcer() {
        if (this.rollEnforcer) {
            clearInterval(this.rollEnforcer);
            this.rollEnforcer = null;
        }
    }

    enableOnlineMode(){
        this.isServerGame = true;
        this.serverRequests = new ServerRequests();
        this.dice.enableOnlineMode(this.serverRequests);
    }

    applyPerspective(colorOverride){
        if (!this.board?.boardElement) return;
        // Keep board unflipped so blue stays at the bottom (server and local)
        this.board.boardElement.classList.remove("flipped");
    }

    setPerspective(color){
        // Flip so the local player's pieces are at the bottom; server colors are Red/Blue
        this.playerColor = color;
        this.applyPerspective(color);
    }

    // Detect the predominant starting row for each color so we know which side counts as "home"
    updateHomeRows(force = false) {
        if (!this.board || !this.board.columns) return;

        const cols = this.board.columns;
        const rows = this.board.rows || 4;
        if (!this.homeRows || force) {
            this.homeRows = { red: 0, blue: rows - 1 };
        } else {
            this.homeRows.red = this.homeRows.red ?? 0;
            this.homeRows.blue = this.homeRows.blue ?? (rows - 1);
        }

        const counts = { red: new Map(), blue: new Map() };
        this.board.pieces.forEach((piece, idx) => {
            if (!piece || !counts[piece.color]) return;
            const row = Math.floor(idx / cols);
            const map = counts[piece.color];
            map.set(row, (map.get(row) || 0) + 1);
        });

        ["red", "blue"].forEach(color => {
            const map = counts[color];
            if (!map || map.size === 0) return;
            if (!force && this.homeRows[color] !== undefined) return;
            const [row] = [...map.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
            this.homeRows[color] = parseInt(row, 10);
        });
    }

    // Returns the opposite edge row for a given color based on detected home rows
    getFinalRowFor(color) {
        const rows = this.board?.rows || 4;
        const homeRow = (this.homeRows && this.homeRows[color] !== undefined)
            ? this.homeRows[color]
            : (color === "blue" ? rows - 1 : 0);
        return homeRow === 0 ? rows - 1 : 0;
    }

    getHomeRowFor(color) {
        const rows = this.board?.rows || 4;
        return (this.homeRows && this.homeRows[color] !== undefined)
            ? this.homeRows[color]
            : (color === "blue" ? rows - 1 : 0);
    }

    hasPiecesInHomeRow(color) {
        const startRow = this.getHomeRowFor(color);
        return this.board.pieces.some((p, idx) => {
            if (!p || p.color !== color) return false;
            const r = Math.floor(idx / this.board.columns);
            return r === startRow;
        });
    }

    canEnterFinalRow(piece, destinationRow) {
        const finalRow = this.getFinalRowFor(piece.color);
        if (destinationRow !== finalRow) return true;               // Not targeting the final row

        // If the piece is already sitting on the final row, let it move along that row.
        const idx = this.board.pieces.indexOf(piece);
        const currentRow = idx >= 0 ? Math.floor(idx / this.board.columns) : null;
        if (currentRow === finalRow) return true;

        // Otherwise, block re-entering the final row after it has already been reached once.
        return !piece.wasAlreadyInLastRow;
    }

    isPieceOnFinalRow(piece, row) {
        if (!piece) return false;
        return row === this.getFinalRowFor(piece.color);
    }

    // === Helper to show no-move messaging and enable appropriate action ===
    showNoMovesMessage() {
        if (this.extraMove) {
            this.board.showMessage(`Player ${this.board.currentPlayer} rolled ${this.diceResult} but has no moves. Roll again!`);
            enableRollButton(this.dice.rollButton);
            this.disablePieceClicks();
            this.skipTurnButton.disabled = true;
        } else {
            this.board.showMessage(`Player ${this.board.currentPlayer} has no possible moves. Click "Skip Turn" to continue the game.`);
            this.skipTurnButton.disabled = false;
            this.disablePieceClicks();
        }
    }

    // === Handles dice result and determines extra move or turn end ===
    onDiceRolled(result) {
        this.diceResult = result;                                      // Save the dice result

        // For online games, server drives the flow after sending dice; avoid local gating
        if (this.isServerGame) {
            return;
        }

        // In online mode, only enable interactions if it's our turn
        if (this.isServerGame && this.serverRequests && this.turnNick && this.turnNick !== this.serverRequests.nick) {
            this.disablePieceClicks();
            this.skipTurnButton.disabled = true;
            return;
        }

        if (result === 1 || result === 4 || result === 6) {            // Values granting extra turn
            this.extraMove = true;                                     // Set extra move flag
            this.board.showMessage(`Player ${this.board.currentPlayer} rolled ${result}. Move a piece and then roll again!`);
        } else if (result === 2 || result === 3) {                     // Values ending turn
            this.extraMove = false;                                    // No extra move
            this.board.showMessage(`Player ${this.board.currentPlayer} rolled ${result}. Move a piece, then turn ends.`);
        }

        // Check if current player has any available moves
        const movesAvailable = this.hasAvailableMoves();

        if (!movesAvailable) {                                         // No moves
            this.showNoMovesMessage();
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
        // If server already highlighted selectable cells, we have moves
        if (this.isServerGame && Array.isArray(this.serverSelected) && this.serverSelected.length > 0) {
            return true;
        }
        const playerColor = this.board.currentPlayer;
        return this.board.pieces.some(piece => {                        // Check each piece
            if (!piece || piece.color !== playerColor) return false;   // Skip if piece is missing or wrong color
            if (!piece.wasMoved && this.diceResult !== 1) return false;// Skip if piece can't move yet
            if (this.isBlockedByStartRow(piece)) return false;         // Skip if blocked by starting row

            const choices = this.decidingPoint(piece);                 // Determine possible destinations
            if (choices && Array.isArray(choices)) {
                return choices.some(idx => {                            // Check if any choice is available
                    if (idx == null) return false;
                    const targetRow = Math.floor(idx / this.board.columns);
                    if (!this.canEnterFinalRow(piece, targetRow)) return false;
                    const targetPiece = this.board.pieces[idx];
                    return !targetPiece || targetPiece.color !== playerColor; // Valid if target empty or enemy
                });
            }
            const destination = this.getDestination(piece);            // Fallback destination
            if (destination == null) return false;
            const targetRow = Math.floor(destination / this.board.columns);
            if (!this.canEnterFinalRow(piece, targetRow)) return false;
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
        enableRollButton(this.dice.rollButton); // Enable dice roll button for next player
        this.dice.resetDiceImage();           // Reset dice image to initial state
    }

    async skipTurnOnline() {
        // Extra-move and no local options: allow reroll instead of calling pass
        const noServerOptions = !Array.isArray(this.serverSelected) || this.serverSelected.length === 0;
        if (this.extraMove && this.diceResult !== null && noServerOptions && !this.hasAvailableMoves()) {
            this.diceResult = null;
            if (this.dice) {
                this.dice.result = null;
                this.dice.resetDiceImage();
                this.dice.updateDiceLabel();
            }
            this.disablePieceClicks();
            if (this.skipTurnButton) this.skipTurnButton.disabled = true;
            enableRollButton(this.dice?.rollButton);
            this.board.showMessage("No valid moves. Roll again.", this.playerColor || "blue");
            return;
        }

        if (this.extraMove && this.diceResult === null) {
            this.board.showMessage("You must roll again before passing.");
            if (this.skipTurnButton) this.skipTurnButton.disabled = true;
            if (this.dice?.rollButton) enableRollButton(this.dice.rollButton);
            return;
        }

        try {
            this.disablePieceClicks();
            if (this.skipTurnButton) this.skipTurnButton.disabled = true;
            if (this.dice?.rollButton) this.dice.rollButton.disabled = true;

            const result = await this.serverRequests.pass(
                this.serverRequests.nick,
                this.serverRequests.password,
                this.serverRequests.gameID
            );

            // If server rejected the pass, let the player retry
            if (result && result.error) {
                console.warn("Pass rejected by server:", result.error);
                this.board.showMessage(result.error, "neutral");
                const hasOptions = Array.isArray(this.serverSelected) && this.serverSelected.length > 0;
                if (this.extraMove && !hasOptions) {
                    // Reset dice to allow a new roll
                    this.diceResult = null;
                    if (this.dice) {
                        this.dice.result = null;
                        this.dice.resetDiceImage();
                        this.dice.updateDiceLabel();
                    }
                    this.disablePieceClicks();
                    if (this.dice?.rollButton) enableRollButton(this.dice.rollButton);
                    if (this.skipTurnButton) this.skipTurnButton.disabled = true;
                } else if (this.diceResult !== null) {
                    // stay in move mode
                    this.enablePieceClicks();
                    if (this.dice?.rollButton) this.dice.rollButton.disabled = true;
                    if (this.skipTurnButton) this.skipTurnButton.disabled = hasOptions;
                } else {
                    if (this.skipTurnButton) this.skipTurnButton.disabled = false;
                    if (this.dice?.rollButton) enableRollButton(this.dice.rollButton);
                }
            }
        } catch (err) {
            console.error("Pass request failed", err);
            this.board.showMessage("Could not pass turn. Try again.", "neutral");
            if (this.skipTurnButton) this.skipTurnButton.disabled = false;
            // Only re-enable roll if it's still our turn and we haven't rolled
            if (this.dice?.rollButton && this.turnNick === this.serverRequests?.nick && this.diceResult === null) {
                enableRollButton(this.dice.rollButton);
            }
        }
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
        // Also clear any cell-level handlers used for server selection
        if (this.board?.cells && (!this.serverSelected || this.serverSelected.length === 0)) {
            this.board.cells.flat().forEach(cell => cell.onclick = null);
        }
    }

    // === Handles piece click: movement, capturing, and turn logic ===
    async onPieceClicked(piece) {
        if (this.isServerGame && this.turnNick && this.serverRequests?.nick && this.turnNick !== this.serverRequests.nick) {
            this.board.showMessage("Wait for your turn.", "neutral");
            return;
        }

        if(this.isServerGame){
            if (this.diceResult === null) {
                this.board.showMessage("Roll the dice first!");
                return;
            }

            // Server-mode: only allow notify when step expects a selection
            const localIdx = this.board.pieces.indexOf(piece);
            const serverIdx = mapLocalIndexToServer(localIdx, this.board.rows, this.board.columns, this.serverInitialColor, true);

            // Only allow clicking own pieces (server will still validate)
            if (piece.color !== this.board.currentPlayer) {
                this.board.showMessage("Select one of your own pieces.");
                return;
            }

            if (!piece.wasMoved && this.diceResult !== 1) {
                this.board.showMessage("You can only start a piece after rolling a 1.");
                return;
            }

            if (!Array.isArray(this.serverSelected) || this.serverSelected.length === 0) {
                if (this.isBlockedByStartRow(piece)) {
                    this.board.showMessage("Pieces on the final row are stuck until your start row is empty.");
                    if (!this.hasAvailableMoves() && this.skipTurnButton) this.skipTurnButton.disabled = false;
                    return;
                }
                const tentativeDest = this.getDestination(piece);
                if (tentativeDest != null) {
                    const targetRow = Math.floor(tentativeDest / this.board.columns);
                    if (!this.canEnterFinalRow(piece, targetRow)) {
                        this.board.showMessage("This piece cannot enter the final row again.");
                        if (!this.hasAvailableMoves() && this.skipTurnButton) this.skipTurnButton.disabled = false;
                        return;
                    }
                }
            }

            // In online mode: if the server sent explicit options, restrict to them; otherwise allow any own piece when step is "from"
            if (Array.isArray(this.serverSelected) && this.serverSelected.length > 0) {
                const allowed = this.serverSelected.includes(serverIdx);
                if (!allowed) {
                    this.board.showMessage("Select one of the highlighted cells.");
                    return;
                }
            } else if (this.serverStep && this.serverStep !== "from") {
                this.board.showMessage("Waiting for the server to highlight valid moves.");
                return;
            }

            console.log("Sending notify to server", { localIdx, serverIdx, step: this.serverStep, selected: this.serverSelected });
            try {
                const res = await this.serverRequests.notify(
                    this.serverRequests.nick,
                    this.serverRequests.password,
                    this.serverRequests.gameID,
                    serverIdx);
                if (res && res.error) {
                console.warn("Notify rejected by server:", res.error);
                // Keep the current dice result; let the user pick another piece/cell
                this.board.showMessage(`Move rejected: ${res.error}. Select another highlighted cell or piece.`);
                this.enablePieceClicks();
                if (Array.isArray(this.serverSelected) && this.serverSelected.length > 0) {
                    bindServerSelection(this.serverSelected); // restore cell handlers if we have them
                }
                this.dice.rollButton.disabled = true;  // keep roll blocked until move resolves
                // If no server options are present and no moves exist, keep Skip available (lets reroll or pass)
                const hasOptions = Array.isArray(this.serverSelected) && this.serverSelected.length > 0;
                const noMoves = !this.hasAvailableMoves();
                this.skipTurnButton.disabled = hasOptions || !noMoves;
                return;
            }
            } catch (err) {
                console.error("Notify request failed", err);
                this.board.showMessage("Failed to send move. Try again.");
                return;
            }

            // Wait for server update; block local interactions
            this.disablePieceClicks();
            this.dice.rollButton.disabled = true;
            this.skipTurnButton.disabled = true;
            return;
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
        const choices = this.decidingPoint(piece);                  // Check if piece is at a decision point

        if (choices && Array.isArray(choices)) {
            const availableChoices = choices
                .filter(idx => idx != null)
                .filter(idx => {
                    const occupant = this.board.pieces[idx];
                    return !(occupant && occupant.color === this.board.currentPlayer);
                })
                .filter(idx => {
                    const targetRow = Math.floor(idx / this.board.columns);
                    return this.canEnterFinalRow(piece, targetRow);
                });

            if (availableChoices.length === 0) {                     // Both paths blocked by own pieces
                this.board.showMessage("You can't move onto your own piece!");
                return;
            }

            if (availableChoices.length === 1) {                     // Only one viable path; move directly
                destination = availableChoices[0];
            } else {                                                 // Two options: highlight for choice
                const chosenIndex = await this.waitForChoice(availableChoices);
                this.disableHighlights();
                destination = chosenIndex;
            }
        }

        const targetPiece = this.board.pieces[destination];          // Check for piece in target cell
        if (targetPiece && targetPiece.color !== this.board.currentPlayer) {
            targetPiece.domElement.remove();                         // Remove opponent piece if present
        } else if (targetPiece && targetPiece.color === this.board.currentPlayer) {
            this.board.showMessage("You can't move onto your own piece!"); // Prevent collision with own piece
            return;
        }

        const destinationRow = Math.floor(destination / this.board.columns);
        if (!this.canEnterFinalRow(piece, destinationRow)) {
            this.board.showMessage("This piece cannot enter the final row again.");
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
            enableRollButton(this.dice.rollButton);                 // Enable roll button for next player
            this.board.showMessage(`Player ${this.board.currentPlayer}'s turn! Roll the dice.`); // Update message
        } else if (this.extraMove) {
            this.diceResult = null;                                  // Reset dice for extra move
            enableRollButton(this.dice.rollButton);                 // Enable roll button
            if (this.skipTurnButton) this.skipTurnButton.disabled = true; // Skip not needed when rolling again
            this.board.showMessage(`Player ${this.board.currentPlayer} can roll again!`); // Notify player
        }
    }

    // === Determines if a piece is blocked because start row has unplayed pieces ===
    isBlockedByStartRow(piece) {
        const playerColor = piece.color;                              // Piece's color
        const startRow = this.getHomeRowFor(playerColor);             // Initial row for this color
        const lastRow = this.getFinalRowFor(playerColor);             // Opposite/final row for this color

        const index = this.board.pieces.indexOf(piece);               // Find piece index in array
        const row = Math.floor(index / this.board.columns);           // Compute row of piece
        if (row !== lastRow) return false;                            // Only relevant for last row

        const hasStartRowPieces = this.hasPiecesInHomeRow(playerColor); // Check if any pieces still in start row

        return hasStartRowPieces;                                     // Return true if start row pieces exist
    }

    // === Determines if a piece is at a decision point and returns alternative destinations ===
    decidingPoint(piece) {
        const index = this.board.pieces.indexOf(piece);               // Get piece index
        if (index === -1) return null;                                // Exit if piece not on board

        const row = Math.floor(index / this.board.columns);           // Compute current row
        const destination = this.getDestination(piece);               // Compute normal destination

        // --- Blue player: decision from row 1 ā†’ 0 ---
        if (piece.color === "blue" && row === 1 && Math.floor(destination / this.board.columns) === 0) {
            if (piece.wasAlreadyInLastRow) return [destination + 2 * this.board.columns, null]; // Already at last row ā†’ only alternative
            return [destination, destination + 2 * this.board.columns]; // Normal + alternative destination
        }

        // --- Red player: decision from row 2 ā†’ 3 ---
        if (piece.color === "red" && row === 2 && Math.floor(destination / this.board.columns) === 3) {
            if (piece.wasAlreadyInLastRow) return [destination - 2 * this.board.columns, null]; // Already at last row ā†’ only alternative
            return [destination, destination - 2 * this.board.columns]; // Normal + alternative destination
        }

        return null;                                                  // No decision point
    }

    waitForChoice(choices) {
        return new Promise((resolve) => {                               // Return a promise that resolves when player chooses a cell
            choices.forEach(idx => {                                    // Loop through each possible choice index
                const cell = this.board.cells[Math.floor(idx / this.board.columns)][idx % this.board.columns]; // Get corresponding cell
                cell.classList.add("highlight");                        // Highlight cell to indicate itā€™s selectable
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

        if (!hasRed) {                                                    // No red pieces ā†’ Blue wins
            this.board.showMessage("Blue wins!");                        // Display message
            this.updateScoreboard("blue");                                // Update scoreboard
            return false;                                                 // Game over
        } else if (!hasBlue) {                                           // No blue pieces ā†’ Red wins
            this.board.showMessage("Red wins!");
            this.updateScoreboard("red");
            return false;
        }

        return true;                                                     // Game continues if both colors exist
    }

    // === Updates the scoreboard for the winner ===
    updateScoreboard(winner) {
        // Refresh leaderboard from server ranking (top 10)
        fetchAndRenderRanking();
    }

        // === Calculates the linear destination index for a piece based on dice roll ===
    getDestination(piece) {
        if(this.diceResult === null) return;                              // No dice rolled — exit
        let steps = this.diceResult;                                      // Number of steps to move
        const index = this.board.pieces.indexOf(piece);                    // Current piece index
        if (index === -1) return;

        let row = Math.floor(index / this.board.columns);                  // Current row
        let col = index % this.board.columns;                              // Current column
        const rowStep = piece.color === "blue" ? -1 : 1;                  // Blue moves up, Red moves down

        while (steps > 0) {                                               // Move step by step
            const movesRight = (row % 2) === 1;                             // Row 0/2 left, row 1/3 right
            col += movesRight ? 1 : -1;                                   // Horizontal move following arrows

            if (col >= this.board.columns) {                              // Overflow to the right
                col = this.board.columns - 1;
                row += rowStep;
            } else if (col < 0) {                                         // Underflow to the left
                col = 0;
                row += rowStep;
            }

            // Clamp row within board bounds
            if (row < 0) row = 0;
            if (row >= this.board.rows) row = this.board.rows - 1;

            steps--;                                                       // Reduce remaining steps
        }

        return row * this.board.columns + col;                             // Convert 2D position to linear index
    }
// === Moves a piece to a new cell and updates board state ===
    movePieceForward(piece, destination){
        const index = this.board.pieces.indexOf(piece);                    // Current piece index
        let row = Math.floor(destination / this.board.columns);            // Destination row
        let col = destination % this.board.columns;                        // Destination column

        if (this.isPieceOnFinalRow(piece, row)) {                          // Piece reaches opposite edge
            piece.reachedLastRow();                                        // Mark piece visually as final
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
            cell.classList.remove("highlight-selectable");
            cell.style.cursor = "";
            cell.onclick = null;                                             // Disable click handler
        });
    }

    // === Switches current player, flips board visually, and manages AI/human turns ===
    switchTurn() {
        this.board.currentPlayer = this.board.currentPlayer === "blue" ? "red" : "blue"; // Toggle player

        this.applyPerspective();                                            // Keep local perspective consistent

        this.board.showMessage(`Player ${this.board.currentPlayer}'s turn! Roll the dice.`); // Update message

        if (this.ai && this.board.currentPlayer === "red") {                 // AI turn logic
            this.dice.rollButton.disabled = true;                             // Disable human roll
            setTimeout(() => this.dice.rollDice(), 1500);                     // AI rolls automatically
        } else {
            enableRollButton(this.dice.rollButton);                           // Enable for human
        }
    }

    // === Start New Game helper: set player vs player mode ===
    setModePlayer() {
        delete this.aiDifficulty;                                             // Remove AI settings
        if (this.dice?.rollButton) enableRollButton(this.dice.rollButton);     // Enable dice
    }

    // === Start New Game helper: set player vs computer mode ===
    setModeComputer(difficulty) {
        this.aiDifficulty = difficulty || "normal";                           // Set AI difficulty
        if (this.dice?.rollButton) enableRollButton(this.dice.rollButton);     // Enable dice for player
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
        enableRollButton(this.game.dice.rollButton);                // Enable dice for first roll
        this.game.playerColor = opponent === "computer" ? "blue" : null; // Single player perspective vs AI
        this.game.applyPerspective();                               // Keep chosen perspective
        this.game.updateHomeRows(true);                             // Refresh orientation for new layout

        // Adjust board orientation for human vs human games
        if (opponent !== "computer") {
            this.game.applyPerspective(this.game.board.currentPlayer); // Follow current player in pass-and-play
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
            enableRollButton(this.game.dice.rollButton);              // Enable human roll
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
            const startingPlayer = winner;                              // Loser gave up ā†’ winner starts

            this.game.board.newBoard(columns, startingPlayer);          // Reset board
            this.game.board.currentPlayer = startingPlayer;             // Set current player
            this.game.playerColor = opponent === "computer" ? "blue" : null; // Keep human perspective if vs AI
            this.game.applyPerspective();
            this.game.updateHomeRows(true);                             // Re-detect home rows after reset

            // Update message box with automatic restart info
            const messageBox = document.getElementById("message-box");
            messageBox.textContent = `New game started automatically after ${currentPlayer} gave up. ${startingPlayer} starts!`;

            enableRollButton(this.game.dice.rollButton);                // Enable dice for next turn
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
            if (!piece.wasMoved && dice !== 1) return;                   // Can't move unrolled pieces unless dice = 1
            if (this.game.isBlockedByStartRow(piece)) return;           // Skip if start-row rule blocks movement

            const decision = this.game.decidingPoint(piece);
            if (decision && Array.isArray(decision)) {
                decision.forEach(idx => {
                    if (idx == null) return;
                    const row = Math.floor(idx / this.game.board.columns);
                    if (!this.game.canEnterFinalRow(piece, row)) return;
                    const target = this.game.board.pieces[idx];
                    if (target && target.color === playerColor) return;
                    const score = this.evaluateMove(piece, idx);
                    possibleMoves.push({ piece, dest: idx, score, target });
                });
                return;
            }

            const dest = this.game.getDestination(piece);               // Calculate destination index
            if (dest == null) return;                                    // Skip invalid destinations
            const destRow = Math.floor(dest / this.game.board.columns);
            if (!this.game.canEnterFinalRow(piece, destRow)) return;     // Skip moves that would re-enter final row

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
            enableRollButton(this.game.dice.rollButton);                // Enable human dice
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
        try {
            const r = await fetch(this.url + endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(obj)
            });

            // Some server errors are returned as plain text; try JSON first then fallback
            const text = await r.text();
            let payload;
            try {
                payload = text ? JSON.parse(text) : {};
            } catch {
                payload = { error: text || `HTTP ${r.status}` };
            }

            if (!r.ok && !payload.error) {
                payload.error = `HTTP ${r.status}`;
            }
            return payload;
        } catch (err) {
            console.error(`POST ${endpoint} failed`, err);
            return { error: "network-error" };
        }
    }

    async _get(endpoint) {
        try {
            const r = await fetch(this.url + endpoint);
            const text = await r.text();
            let payload;
            try {
                payload = text ? JSON.parse(text) : {};
            } catch {
                payload = { error: text || `HTTP ${r.status}` };
            }
            if (!r.ok && !payload.error) {
                payload.error = `HTTP ${r.status}`;
            }
            return payload;
        } catch (err) {
            console.error(`GET ${endpoint} failed`, err);
            return { error: "network-error" };
        }
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
        // Converte group e size para números
        const groupNum = parseInt(group, 10);
        const sizeNum = parseInt(size, 10);
        
        // Validação básica antes de enviar
        if (isNaN(groupNum) || isNaN(sizeNum)) {
            return { error: "Group and size must be valid numbers" };
        }
        
        // Cria o objeto no formato que o servidor espera
        const body = { group: groupNum, size: sizeNum };
        
        // Usa apenas POST (conforme especificação)
        const result = await this._post("ranking", body);
        
        // Verifica se a resposta contém 'ranking' ou 'error'
        if (result && result.error) {
            console.error("Ranking error:", result.error);
            // Mapeia erros específicos para mensagens amigáveis
            const errorMessages = {
                "Undefined group": "Group number is required",
                "Invalid size": "Invalid board size",
                "Invalid group": "Invalid group number"
            };
            result.error = errorMessages[result.error] || result.error;
            return result;
        }
        
        // Garante que ranking seja um array
        if (!result.ranking) {
            result.ranking = [];
        }
        
        return result;
    }
}

// === Initialize game and sidebar when DOM is ready ===
document.addEventListener("DOMContentLoaded", () => {
    const game = new Game(9, "blue");              // Default board with 9 columns, blue starts
    const sidebar = new SidebarUI(game);           // Link sidebar UI to game
    game.setModeComputer("normal");                // Set AI mode
    game.ai = new AIPlayer(game, "normal");        // Instantiate AI player

    // Initial message for default game
    game.board.showMessage("Default game started: Player (Blue) vs AI (Red). Blue starts! Start a new game in the sidebar.");

    // Load initial ranking table
    fetchAndRenderRanking();
    // Refresh ranking when group/size inputs change
    const groupInput = document.getElementById("groupInput");
    const sizeSelect = document.getElementById("sizeSelect") || document.getElementById("columnsSelect");
    [groupInput, sizeSelect].forEach(el => {
        if (el) el.addEventListener("change", () => fetchAndRenderRanking());
    });
    
    
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
                // === Empty response {} ā†’ means success or confirmation ===
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
    
    let updateSource = null; // Holds the active EventSource for /update SSE
    
    // Close the current update stream (if any)
    function closeUpdateStream() {
        if (updateSource) {
            updateSource.close();
            updateSource = null;
        }
    }
    
    // Apply a single server update payload to the UI/board
    function handleServerUpdate(update, nick) {
        const playersCache = update.players || game.lastPlayers || {};
        if (update.players) game.lastPlayers = update.players;
        const getColorForNick = (playersObj, nickValue, fallback) => {
            if (!playersObj || !nickValue) return fallback;
            const entry = Object.entries(playersObj).find(([k]) => k.toLowerCase() === nickValue.toLowerCase());
            return entry ? entry[1].toLowerCase() : fallback;
        };
        const myNickResolved = game.serverRequests?.nick
            || (window.currentGame && window.currentGame.nick)
            || (window.currentUser && window.currentUser.nick)
            || nick;
        const myNickLower = myNickResolved ? myNickResolved.toLowerCase() : null;

        // Drop updates that belong to a different game
        const currentGameId = (window.currentGame && window.currentGame.id) || game.serverRequests?.gameID;
        const updateGameId = update.game;
        if (currentGameId && updateGameId && updateGameId !== currentGameId) {
            console.warn("Ignoring update for different game", { updateGameId, currentGameId });
            return;
        }

        // Ensure we keep the server-declared initial color across updates
        const initColorUpdate = deriveInitialColor(update);
        if (initColorUpdate) game.serverInitialColor = game.serverInitialColor || initColorUpdate;

        // Local UI helper that delegates to the global enableRollButton helper
        const enableRollButtonUI = () => {
            if (game?.dice?.rollButton) {
                enableRollButton(game.dice.rollButton);
            }
        };

        const readyToRoll = (msg, colorOverride) => {
            game.forceRollReady = true;
            game.startRollEnforcer();
            game.diceResult = null;
            if (game.dice) {
                game.dice.result = null;
                game.dice._rolling = false;
                game.dice.resetDiceImage();
                game.dice.updateDiceLabel();
            }
            game.disableHighlights();
            game.disablePieceClicks();
            game.skipTurnButton.disabled = true;
            enableRollButtonUI();
            // Double-tap in next tick in case something else toggles the attribute
            setTimeout(() => enableRollButtonUI(), 0);
            if (msg) {
                const isMyTurnNow = game.turnNick && myNickLower && game.turnNick.toLowerCase() === myNickLower;
                const color = colorOverride !== undefined
                    ? colorOverride
                    : (isMyTurnNow ? (game.playerColor || game.board.currentPlayer) : "neutral");
                game.board.showMessage(msg, color);
            }
        };
        if (!update) return;

        // Track server-declared step/selected early
        if (typeof update.step === "string") {
            game.serverStep = update.step;
        }
        if (Array.isArray(update.selected)) {
            game.serverSelected = update.selected.slice();
        } else {
            game.serverSelected = null;
        }

        // Early guard: if server sets step back to "from" with no dice value, clear dice and prep roll state
        if (update.step === "from" && (update.dice === null || update.dice === undefined)) {
            game.diceResult = null;
            if (game.dice) {
                game.dice.result = null;
                game.dice.resetDiceImage();
                game.dice.updateDiceLabel();
            }
            game.serverSelected = null;
            game.disableHighlights();
            game.disablePieceClicks();
            const isTurnNow = update.turn && myNickLower && update.turn.toLowerCase() === myNickLower;
            if (isTurnNow) {
                game.forceRollReady = true;
                enableRollButton(game.dice?.rollButton);
                game.skipTurnButton.disabled = true;
                game.board.showMessage("You can roll again.", game.playerColor || "blue");
            } else {
                game.dice.rollButton.disabled = true;
                game.skipTurnButton.disabled = true;
                game.stopRollEnforcer();
            }
        }

        if (update.error) {
            console.error("Error in update:", update.error);
            gameStatus.innerHTML = `<p>Status: Error - ${update.error}</p>`;
            closeUpdateStream();
            return;
        }

        if (update.game) {
            gameIdDisplay.textContent = `Game ID: ${update.game}`;
        }

        // Initial sync when game starts or state changes
        if (update.pieces || update.players) {
            console.log("Game state received from server", update);
            const pieces = update.pieces;
            const lengthChanged = Array.isArray(pieces) && pieces.length !== game.board.pieces.length;
            if (update.initial && update.players && update.players[update.initial]) {
                game.serverInitialColor = update.players[update.initial].toLowerCase();
            }
            if (!game.hasServerSync || lengthChanged) {
                initializeGameFromServer(update);
                game.hasServerSync = true;
            } else if (Array.isArray(pieces)) {
                const initColor = deriveInitialColor(update);
                if (initColor) game.serverInitialColor = game.serverInitialColor || initColor;
                syncBoardFromServerPieces(pieces, game.serverInitialColor || initColor);
            }
            if (leaveGameBtn) leaveGameBtn.disabled = false;
            gameStatus.innerHTML = '<p>Status: Game started!</p>';
        }

        let isMyTurnFinal = false;

        // Always refresh local playerColor from server mapping if available
        const mappedColor = getColorForNick(update.players, myNickResolved, game.playerColor || null);
        if (mappedColor) game.playerColor = mappedColor;

        // Dice result sent by server (property name may vary between dice/says)
        const dicePayload = update.dice ?? update.says;
        if (dicePayload !== undefined) {
            game.forceRollReady = false; // any fresh dice payload clears forced ready state
            if (dicePayload === null) {
                game.diceResult = null;
                if (game.dice) {
                    game.dice.result = null;
                    game.dice.resetDiceImage();
                    game.dice.updateDiceLabel();
                }
                // Keep extraMove as-is (it comes from the last dice keepPlaying flag)
                game.disableHighlights();
                game.serverSelected = null;
                game.serverStep = "from";
                game.disablePieceClicks(); // also clears cell handlers
                if (game.board?.cells) {
                    game.board.cells.flat().forEach(cell => cell.onclick = null);
                }
                // If it's still our turn and an extra roll is pending, allow rolling again
                const isMyTurnNow = game.turnNick && myNickLower && game.turnNick.toLowerCase() === myNickLower;
                if (isMyTurnNow && game.extraMove) {
                    readyToRoll("You can roll again.");
                }
            } else {
                const diceValue = typeof dicePayload === "object" && dicePayload !== null
                    ? dicePayload.value
                    : dicePayload;
                if (diceValue !== undefined && diceValue !== null) {
                    game.dice.updateFromServer(diceValue);
                    game.diceResult = diceValue === 0 ? 6 : diceValue; // treat 0 as 6 for movement
                }
                const keepPlaying = (dicePayload && typeof dicePayload.keepPlaying === "boolean")
                    ? dicePayload.keepPlaying
                    : [1, 4, 6].includes(game.diceResult);
                game.extraMove = keepPlaying;
                game.stopRollEnforcer();
            }

            const isMyTurn = game.turnNick
                ? (myNickLower && game.turnNick.toLowerCase() === myNickLower)
                : false;
            if (isMyTurn) {
                if (!game.isServerGame) {
                    // Offline mode only: locally detect no-move states
                    const noMovesAvailable = game.diceResult !== null && !game.hasAvailableMoves();
                    if (noMovesAvailable) {
                        if (game.extraMove) {
                            const rolledShown = game.diceResult;
                            game.diceResult = null;
                            if (game.dice) {
                                game.dice.result = null;
                                game.dice.resetDiceImage();
                                game.dice.updateDiceLabel();
                            }
                            game.disablePieceClicks();
                            enableRollButton(game.dice?.rollButton);
                            game.skipTurnButton.disabled = false;
                            game.board.showMessage(`No valid move with this roll (${rolledShown}). Press Skip Turn to confirm or Roll Dice to try again.`);
                            game.forceRollReady = true;
                            game.startRollEnforcer();
                            return;
                        } else {
                            game.board.showMessage("No valid moves. Click Skip Turn.");
                            game.disablePieceClicks();
                            game.dice.rollButton.disabled = true;
                            game.skipTurnButton.disabled = false;
                            return;
                        }
                    }
                }

                if (game.diceResult === null) {
                    game.board.showMessage("Roll the dice.");
                    enableRollButton(game.dice?.rollButton);
                    game.disablePieceClicks();
                    game.skipTurnButton.disabled = true;
                } else {
                    game.board.showMessage(`You rolled ${game.diceResult}. ${game.extraMove ? "Move, then roll again if allowed." : "Make a move or press Skip."}`, game.playerColor || "blue");
                    game.dice.rollButton.disabled = true;
                    // Always allow selecting your pieces; server validates the move
                    game.enablePieceClicks();
                    game.skipTurnButton.disabled = game.extraMove; // extra roll -> skip off
                }
            }
        }

        // Turn / mustPass toggles
        if (update.turn) {
            const prevTurn = game.turnNick;
            game.turnNick = update.turn;
            const turnColor = getColorForNick(playersCache, update.turn, game.board.currentPlayer);
            game.board.currentPlayer = turnColor;
            // Refresh and persist initial color if provided in this payload
            const initColorTurn = deriveInitialColor(update);
            if (initColorTurn) game.serverInitialColor = game.serverInitialColor || initColorTurn;
            // Set/keep local player color and perspective
            if (myNickLower && playersCache) {
                // case-insensitive lookup of our color (always refresh from server)
                const pColor = Object.entries(playersCache).find(([k]) => k.toLowerCase() === myNickLower)?.[1];
                if (pColor) game.playerColor = pColor.toLowerCase();
            }
            if (game.isServerGame) {
                game.setPerspective(game.serverInitialColor || game.playerColor);
            } else if (game.playerColor) {
                game.setPerspective(game.playerColor);
            }

            const isMyTurn = myNickLower ?
    myNickLower === game.turnNick.toLowerCase() : false;
            const turnChanged = !prevTurn || prevTurn !== game.turnNick;
            const turnSwitchedPlayer = prevTurn && prevTurn !== game.turnNick;

            // Only wipe dice state when the turn actually moves to the other player or away from us
            if (turnSwitchedPlayer || !isMyTurn) {
                game.stopRollEnforcer();
                game.diceResult = null;
                // DO NOT clear extraMove here; server may still owe us an extra roll.
                // Keep the last dice image so both players can see what was rolled.
                game.disablePieceClicks(); // clicks enabled after dice arrives
                game.skipTurnButton.disabled = true;
            }

            const extraRollPending = game.extraMove && game.diceResult === null;

            // If server says it's not our turn, only drop forced roll state when no extra roll is pending
            if (!isMyTurn && !extraRollPending) {
                game.forceRollReady = false;
                game.stopRollEnforcer();
            }

            // Keep the roll button alive whenever an extra roll is pending
            if (extraRollPending) {
                game.forceRollReady = true;
                game.startRollEnforcer();
            }

            if (!isMyTurn && !game.forceRollReady) {
                game.dice.rollButton.disabled = true;
            } else {
                enableRollButton(game.dice?.rollButton);
            }
            const myColor = getColorForNick(playersCache, myNickResolved, game.playerColor || turnColor);
            if (myColor) game.playerColor = myColor; // persist the resolved color
            const colorLabel = myColor ? myColor.charAt(0).toUpperCase() + myColor.slice(1) : "Unknown";
            const turnLabel = isMyTurn ? "Your turn!" : `Player ${update.turn}'s turn!`;
            game.board.showMessage(`You are ${colorLabel}. ${turnLabel}`, isMyTurn ? (game.playerColor || "blue") : "neutral");
            if (turnChanged) game.disableHighlights();

            // If the server already sent a dice result earlier for our turn, keep skip enabled
            if (isMyTurn && game.diceResult !== null) {
                if (!game.isServerGame) {
                    game.enablePieceClicks();
                    game.skipTurnButton.disabled = game.extraMove; // extra roll -> skip off
                } else {
                    if (Array.isArray(game.serverSelected) && game.serverSelected.length > 0) {
                        bindServerSelection(game.serverSelected);
                    } else if (game.serverStep === "from") {
                        game.enablePieceClicks();
                    } else {
                        game.disablePieceClicks(); // wait for server step
                    }
                    game.skipTurnButton.disabled = true;
                }
                game.dice.rollButton.disabled = true;
            }

            // If it's still our turn and we earned an extra roll, let us roll again
            if (isMyTurn && game.extraMove && game.diceResult === null) {
                game.disableHighlights();
                game.disablePieceClicks();
                game.skipTurnButton.disabled = true;
                enableRollButton(game.dice?.rollButton);
                game.board.showMessage(`You can roll again.`, game.playerColor || "blue");
            }
        }

        if (typeof update.mustPass === "boolean") {
            const isMyTurn = game.turnNick && myNickLower
                ? game.turnNick.toLowerCase() === myNickLower
                : !!game.serverRequests?.nick;
            if (update.mustPass && isMyTurn) {
                game.extraMove = false; // cannot keep extra roll if we must pass
                game.disablePieceClicks();
                game.dice.rollButton.disabled = true;
                game.skipTurnButton.disabled = false;
                game.board.showMessage("No valid moves: you must pass.");
            } else if (!update.mustPass && isMyTurn && game.diceResult !== null) {
                game.enablePieceClicks();
                game.skipTurnButton.disabled = false; // allow skip; server enforces validity
            }
        }

        // Safety net: if it's our turn, extra roll is pending, and no dice result is active, enable rolling again
        const stillMyTurn = game.turnNick && myNickLower && game.turnNick.toLowerCase() === myNickLower;
        if (stillMyTurn && game.extraMove && game.diceResult === null) {
            game.disableHighlights();
            game.disablePieceClicks();
            game.skipTurnButton.disabled = true;
            enableRollButton(game.dice.rollButton);
            game.dice.rollButton.removeAttribute("disabled");
        }

        // Ensure controls align with current state when it's our turn
        const iAmUp = game.turnNick && myNickLower && game.turnNick.toLowerCase() === myNickLower;
        if (iAmUp) {
            const hasServerOptions = Array.isArray(game.serverSelected) && game.serverSelected.length > 0;
            if (game.diceResult !== null) {
                game.enablePieceClicks();
                game.dice.rollButton.disabled = true;   // already rolled; waiting for move
                // Allow Skip if there are no server options or the server says mustPass;
                // otherwise block Skip only when extra rolls apply AND there is at least one option
                const allowSkip = (!game.extraMove || !hasServerOptions);
                // If we have an extra roll but no moves and no server options, auto-clear dice to allow reroll
                const noLocalMoves = !hasServerOptions && !game.hasAvailableMoves();
                if (game.extraMove && noLocalMoves && game.diceResult !== 1) {
                    const lastRoll = game.diceResult;
                    game.diceResult = null;
                    if (game.dice) {
                        // Keep showing the last roll value so the player knows what they rolled
                        game.dice.result = lastRoll;
                        game.dice.updateDiceLabel();
                        game.dice._rolling = false;
                    }
                    game.disablePieceClicks();
                    game.skipTurnButton.disabled = true;
                    enableRollButton(game.dice.rollButton);
                    game.board.showMessage(`No valid moves with roll ${lastRoll}. Roll again.`, game.playerColor || "blue");
                } else {
                    game.skipTurnButton.disabled = !allowSkip;
                }
                // Server may keep selected highlight options; avoid stale highlights on choice completion
                if (!game.extraMove) game.disableHighlights();
            } else {
                game.disablePieceClicks();
                enableRollButton(game.dice.rollButton);  // ready to roll
                game.skipTurnButton.disabled = true;
                game.disableHighlights();
            }
        }

        // Highlight last move / selectable cells if server provides selected indices
        if (Array.isArray(update.selected)) {
            game.serverSelected = update.selected.slice();

            // If server sends selection but no dice info and we are back to "from", consider the move finished
            if (update.step === "from") {
                game.diceResult = null;
                if (game.dice) {
                    game.dice.result = null;
                    game.dice.resetDiceImage();
                    game.dice.updateDiceLabel();
                }
                // Treat this as a finished move: clear server-selected pointers
                game.serverSelected = null;
                game.serverStep = "from";
            }

            // Highlight whenever the server sends selectable cells (step not equal to "from"),
            // even if the dice value was already consumed (diceResult can be null).
            const shouldHighlight = update.step && update.step !== "from";

            game.disableHighlights();
            if (shouldHighlight) {
                update.selected.forEach(idx => {
                    if (typeof idx !== "number") return;
                    const localIdx = mapServerIndexToLocal(idx, game.board.rows, game.board.columns, game.serverInitialColor || deriveInitialColor(update), true);
                    const row = Math.floor(localIdx / game.board.columns);
                    const col = localIdx % game.board.columns;
                    const cell = game.board.cells?.[row]?.[col];
                    if (cell) cell.classList.add("highlight");
                });
            } else {
                game.serverSelected = null;
            }

            // If server indicates a selection step, bind clicks to highlighted cells
            if (shouldHighlight && game.isServerGame && update.step && game.serverSelected) {
                game.serverStep = update.step;
                bindServerSelection(game.serverSelected);
            }

            if (!shouldHighlight) {
                const isMyTurn = game.turnNick && myNickLower && game.turnNick.toLowerCase() === myNickLower;
                // After move is reflected, only prompt rolling again on our own turn
                if (isMyTurn) {
                    // Clear dice state and prepare for the next roll or next turn
                    const msg = game.extraMove
                        ? "Move registered. Roll again when ready."
                        : "Your turn. Roll the dice to play.";
                    readyToRoll(msg, game.playerColor || "blue");
                    return; // <- add this line
                } else {
                    game.dice.rollButton.disabled = true;
                    game.skipTurnButton.disabled = true;
                    game.stopRollEnforcer();
                    game.board.showMessage("Waiting for opponent.", "neutral");
                }
            }
 else if (game.serverSelected.length > 0) {
                // While a selection is pending, block rolling/passing until a destination is chosen
                game.dice.rollButton.disabled = true;
                game.skipTurnButton.disabled = true;
                game.board.showMessage("Select one of the highlighted cells to complete the move.");
            }

            // After a move is reflected, if it's still our turn with an extra roll, enable rolling again
            const isMyTurn = game.turnNick && myNickLower && game.turnNick.toLowerCase() === myNickLower;
            if (isMyTurn && game.extraMove && game.diceResult === null) {
                game.disablePieceClicks();
                game.skipTurnButton.disabled = true;
                enableRollButton(game.dice.rollButton);
            }
        } else if (game.isServerGame && game.serverStep === "from" && isMyTurnFinal && game.diceResult !== null) {
            // No selected list provided; allow choosing any own piece to start the move
            game.enablePieceClicks();
            game.skipTurnButton.disabled = game.extraMove; // extra roll -> skip off
            game.dice.rollButton.disabled = true;
        }

        // Final consistency: if it's our turn and we have a dice result, make sure we can act
        isMyTurnFinal = game.turnNick && myNickLower && game.turnNick.toLowerCase() === myNickLower;
        if (typeof update.step === "string") {
            game.serverStep = update.step;
        }

        const mustPass = typeof update.mustPass === "boolean" ? update.mustPass : false;
        if (isMyTurnFinal && game.diceResult !== null && !mustPass) {
            if (!game.isServerGame) {
                game.enablePieceClicks();
            } else {
                // rely on server step; clicks bound via bindServerSelection or allow piece selection on "from"
                if (Array.isArray(game.serverSelected) && game.serverSelected.length > 0) {
                    bindServerSelection(game.serverSelected);
                } else if (game.serverStep === "from") {
                    game.enablePieceClicks(); // allow choosing a piece; notify will remap index
                } else {
                    game.disablePieceClicks();
                }
            }
            game.skipTurnButton.disabled = game.extraMove; // extra roll -> skip off
            game.dice.rollButton.disabled = true;
        }

        // Extra-roll guard: when an extra roll is pending, keep skip off and roll enabled
        if (isMyTurnFinal && game.extraMove && game.diceResult === null) {
            game.disablePieceClicks();
            game.skipTurnButton.disabled = true;
            game.forceRollReady = true;
            game.startRollEnforcer();
            enableRollButton(game.dice?.rollButton);
        }

        // If server puts us back to step "from" with no dice value, force-ready to roll on our turn
        if (update.step === "from" && (update.dice === null || update.dice === undefined)) {
            const isMyTurn = game.turnNick && myNickLower && game.turnNick.toLowerCase() === myNickLower;
            if (isMyTurn) {
                readyToRoll("You can roll again.", game.playerColor || "blue");
            } else {
                game.dice.rollButton.disabled = true;
                game.skipTurnButton.disabled = true;
                game.board.showMessage("Waiting for opponent.", "neutral");
            }
        }

        // Final guard: if it's our turn and no dice is active, allow rolling
        if (isMyTurnFinal && game.diceResult === null) {
            game.disableHighlights();
            game.disablePieceClicks();
            game.skipTurnButton.disabled = true;
            enableRollButton(game.dice?.rollButton);
            if (game.extraMove) {
                game.board.showMessage("You can roll again.", game.playerColor || "blue");
            } else {
                game.board.showMessage("Roll the dice to play.", game.playerColor || "blue");
            }
        }

        // If we explicitly marked the state as ready-to-roll, keep the roll button usable
        if (game.forceRollReady) {
            enableRollButton(game.dice?.rollButton);
            game.skipTurnButton.disabled = true;
            if (game.dice) game.dice._rolling = false;
        }

        // Absolute fail-safe: if it's still our turn and no dice value is active, ensure the roll button is enabled
        const turnMatches = game.turnNick && myNickLower && game.turnNick.toLowerCase() === myNickLower;
        if (turnMatches && game.diceResult === null) {
            enableRollButton(game.dice?.rollButton);
            game.skipTurnButton.disabled = true;
        }

        // End of game
        if (update.winner !== undefined) {
            console.log("Game ended with winner:", update.winner);
            gameStatus.innerHTML = `<p>Status: Game ended. Winner: ${update.winner || "None"}</p>`;
            
            if (leaveGameBtn) leaveGameBtn.disabled = true;
            closeUpdateStream();
            game.disablePieceClicks();
            game.dice.rollButton.disabled = true;
            game.skipTurnButton.disabled = true;
            game.stopRollEnforcer();
            
            const messageBox = document.getElementById("message-box");
            if (messageBox) {
                if (update.winner === null) {
                    messageBox.textContent = "Game ended without a winner.";
                } else if (update.winner === nick) {
                    messageBox.textContent = "Congratulations! You won!";
                } else {
                    messageBox.textContent = `Game over. ${update.winner} wins!`;
                }
                game.board.showMessage(`Game ended. Winner: ${update.winner || "None"}`, "neutral");

                // Persist the group/size used in this finished game for ranking refresh
                if (window.currentGame) {
                    lastGroup = window.currentGame.group || lastGroup;
                    lastSize = window.currentGame.size || lastSize;
                }

                // Refresh ranking now that the server declared a winner
                fetchAndRenderRanking();
            }
        }
    }
    
    // Start listening to server-sent events for /update
    function startUpdateStream(nick, gameId) {
        const server = new ServerRequests();
        closeUpdateStream();

        const params = new URLSearchParams({ nick, game: gameId });
        const url = `${server.url}update?${params.toString()}`;

        gameStatus.innerHTML = '<p>Status: Waiting for updates...</p>';
        updateSource = new EventSource(url);

        updateSource.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                handleServerUpdate(payload, nick);
            } catch (err) {
                console.error("Invalid update payload from server", err, event.data);
            }
        };

        updateSource.onerror = (err) => {
            console.error("Error in update SSE stream:", err);
            gameStatus.innerHTML = '<p>Status: Connection error while receiving updates.</p>';
            closeUpdateStream();
        };
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
                
                // Stop server updates
                closeUpdateStream();
                
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
                lastGroup = group;
                lastSize = sizeNum;

                    // Switch game into online mode so rolls/moves go through the server
                    game.enableOnlineMode();
                    if (game.serverRequests) {
                        game.serverRequests.group = group;
                        game.serverRequests.nick = nick;
                        game.serverRequests.password = password;
                        game.serverRequests.gameID = response.game;
                        game.serverRequests.size = sizeNum;
                    }
                    game.ai = null; // Disable AI for online play
                    
                    // Enable leave button
                    if (leaveGameBtn) {
                        leaveGameBtn.disabled = false;
                        leaveGameBtn.textContent = "Leave Game";
                    }
                    
                    // Start listening for server-sent events on /update
                    startUpdateStream(nick, response.game);

                    // Refresh ranking after successful join (using current group/size)
                    fetchAndRenderRanking();
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
    function deriveInitialColor(gameData) {
        if (!gameData || !gameData.players || !gameData.initial) return null;
        const nick = gameData.initial;
        const color = gameData.players[nick];
        return color ? color.toLowerCase() : null;
    }

    function bindServerSelection(selectedIndices) {
        game.disablePieceClicks();
        game.board.cells.flat().forEach(cell => cell.onclick = null);
        selectedIndices.forEach(idx => {
            if (typeof idx !== "number") return;
            const serverIdx = idx; // keep original server index for notify
            const localIdx = mapServerIndexToLocal(idx, game.board.rows, game.board.columns, game.serverInitialColor, true);
            const row = Math.floor(localIdx / game.board.columns);
            const col = localIdx % game.board.columns;
            const cell = game.board.cells?.[row]?.[col];
            if (!cell) return;
            cell.classList.add("highlight-selectable");
            cell.style.cursor = "pointer";
            console.log("[Select] Binding click for option", { serverIdx, localIdx, row, col, step: game.serverStep });
            cell.onclick = async () => {
                console.log("Server selection click -> notify", { localIdx, serverIdx, step: game.serverStep, selected: selectedIndices });
                try {
                    const res = await game.serverRequests.notify(
                        game.serverRequests.nick,
                        game.serverRequests.password,
                        game.serverRequests.gameID,
                        serverIdx
                    );
                    if (res && res.error) {
                        console.warn("Notify rejected by server:", res.error);
                        game.board.showMessage(`Move rejected: ${res.error}`);
                        bindServerSelection(selectedIndices); // keep options active
                        return;
                    }
                    game.disablePieceClicks();
                    game.board.cells.flat().forEach(c => c.onclick = null);
                    game.dice.rollButton.disabled = true;
                    game.skipTurnButton.disabled = true;
                } catch (err) {
                    console.error("Notify failed", err);
                    game.board.showMessage("Failed to send move. Try again.");
                    bindServerSelection(selectedIndices); // rebind to let player retry
                }
            };
        });
    }

    function initializeGameFromServer(gameData) {
        console.log("Initializing game with data:", gameData);

        // Ensure local game is configured for server play
        if (!game.isServerGame) {
            game.enableOnlineMode();
        }
        if (window.currentGame && game.serverRequests) {
            game.serverRequests.group = window.currentGame.group;
            game.serverRequests.nick = window.currentGame.nick;
            game.serverRequests.password = window.currentGame.password;
            game.serverRequests.gameID = window.currentGame.id;
            game.serverRequests.size = window.currentGame.size;
        }
        game.ai = null; // Never use AI when in online mode
        
        // Check if we have valid game data
        if (!gameData.pieces || !Array.isArray(gameData.pieces)) {
            console.error("Invalid game data from server");
            gameStatus.innerHTML = '<p>Status: Error - Invalid game data</p>';
            return;
        }
        
        // Calculate board size from pieces array
        const totalCells = gameData.pieces.length;
        const calculatedSize = totalCells / 4; // 4 rows
        const requestedSize = window.currentGame ? window.currentGame.requestedSize : null;

        // If we didn't have a currentGame context (e.g., page refresh mid-game), populate it now
        if (!window.currentGame) {
            window.currentGame = {
                id: gameData.game || game.serverRequests?.gameID || null,
                group: game.serverRequests?.group || "99",
                nick: game.serverRequests?.nick || null,
                password: game.serverRequests?.password || null,
                size: calculatedSize,
                requestedSize: calculatedSize
            };
            lastGroup = window.currentGame.group;
            lastSize = calculatedSize;
        }
        
        // actual verification
        if (requestedSize && requestedSize !== calculatedSize) {
            console.error(`Error: Requested size ${requestedSize} but server paired with size ${calculatedSize}.`);
            
            // Update status
            gameStatus.innerHTML = `<p>Status: Error - Wrong board size (you: ${requestedSize}, server: ${calculatedSize})</p>`;
            
            // Show error message
            const messageBox = document.getElementById("message-box");
            if (messageBox) {
                messageBox.textContent = `Error: You requested ${requestedSize} columns but were paired with ${calculatedSize} columns. Leaving game.`;
            }
            
            // Automatically leave the game because it's not what the player wanted
            setTimeout(() => {
                leaveCurrentGame();
            }, 2000);
            
            return; 
        }

        if (window.currentGame) {
            window.currentGame.size = calculatedSize;
        }
        
        
        // Update board with the calculated size 
        game.board.newBoard(calculatedSize, "blue");
        
        // Determine player color (server declares colors per nick)
        const myNick = window.currentGame ? window.currentGame.nick : null;
        let myColor = "blue";
        
        if (myNick && gameData.players) {
            const entry = Object.entries(gameData.players).find(([k]) => k.toLowerCase() === myNick.toLowerCase());
            if (entry) myColor = entry[1];
        }
        game.playerColor = myColor.toLowerCase();
        // Remember server initial color to remap indices and orient board
        game.serverInitialColor = deriveInitialColor(gameData);

        // Clear and reposition pieces
        syncBoardFromServerPieces(gameData.pieces, game.serverInitialColor, true);
        
        // Set current player (server provides nick, map to color for local logic)
        if (gameData.turn) {
            game.turnNick = gameData.turn;
            const turnColor = gameData.players && gameData.players[gameData.turn]
                ? gameData.players[gameData.turn].toLowerCase()
                : game.board.currentPlayer;
            game.board.currentPlayer = turnColor;
            game.diceResult = null;
            game.dice.resetDiceImage();

            const isMyTurn = game.serverRequests?.nick === game.turnNick;
            game.dice.rollButton.disabled = !isMyTurn;
            game.disablePieceClicks(); // enable after dice is rolled
            game.skipTurnButton.disabled = true;

            // Inform player of their color
            const messageBox = document.getElementById("message-box");
            if (messageBox) {
                const myNickNow = window.currentGame ? window.currentGame.nick : null;
                const myColorNow = myNickNow && gameData.players && gameData.players[myNickNow]
                    ? gameData.players[myNickNow]
                    : game.playerColor || turnColor;
                const colorLabelNow = myColorNow ? myColorNow.charAt(0).toUpperCase() + myColorNow.slice(1) : "Unknown";
                messageBox.textContent = `You are ${colorLabelNow}. Player ${gameData.turn}'s turn! Roll when enabled.`;
            }

            // Adjust orientation to server initial perspective (so indices match server)
            const orientColor = game.serverInitialColor || game.playerColor || turnColor;
            game.setPerspective(orientColor);
        }
        
        // Update UI orientation locked to server initial to keep index mapping stable
        game.setPerspective(game.serverInitialColor || game.playerColor);
        
        // Update message
        const messageBox = document.getElementById("message-box");
        if (messageBox) {
            const opponentNick = Object.keys(gameData.players || {}).find(nick => nick !== myNick);
            messageBox.textContent = `Online game started! Board: ${calculatedSize} columns. You are ${myColor}.`;
        }
        
        // Update status
        gameStatus.innerHTML = '<p>Status: Game started!</p>';
    }

function syncBoardFromServerPieces(pieces, initialColor, forceHomeRows = false) {
    if (!Array.isArray(pieces)) return;
    // Only sync if the payload matches current board size
    if (pieces.length !== game.board.pieces.length) return;

        const cols = game.board.columns;
        const rows = game.board.rows;

        game.board.pieces.fill(null);
        pieces.forEach((pieceInfo, index) => {
            if (!pieceInfo) return;
            const color = typeof pieceInfo === "string"
                ? pieceInfo.toLowerCase()
                : pieceInfo.color?.toLowerCase();
            if (!color) return;
            const piece = new Piece(color);

            // Sync movement flags coming from the server so local logic (wasMoved/wasAlreadyInLastRow)
            // matches the authoritative state. Use the same helpers we use in local play to keep
            // visual classes and flags aligned.
            const movedFlag = pieceInfo.moved || pieceInfo.inMotion;
            const finalFlag = pieceInfo.final || pieceInfo.reachedLastRow;

            if (movedFlag) piece.firstmove();
            if (finalFlag) piece.reachedLastRow();

            const mappedIndex = mapServerIndexToLocal(index, rows, cols, initialColor, true);
            game.board.pieces[mappedIndex] = piece;
        });

        // After placing everything, re-derive orientation and mark pieces that naturally sit on their final row
        game.updateHomeRows(forceHomeRows);
        game.board.pieces.forEach((piece, idx) => {
            if (!piece || piece.wasAlreadyInLastRow) return;
            const row = Math.floor(idx / cols);
            if (game.isPieceOnFinalRow(piece, row)) {
                piece.reachedLastRow();
            }
        });

        game.board.showPieces();

        // If server sent a step, bind clicks to those cells only
        if (game.serverStep && Array.isArray(game.serverSelected)) {
            bindServerSelection(game.serverSelected);
        }
    }
});
