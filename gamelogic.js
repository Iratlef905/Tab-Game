class Piece {
    constructor(color){
        this.color = color;
        this.moved = false;
        this.isLastRow = false;
        this.domElement = document.createElement("div");
        this.domElement.classList.add("piece", this.color);
    }
 
    firstmove(){
        this.moved = true;
    }

    reachedLastRow(){
        this.isLastRow = true;
    }

    animate(cell){
        cell.appendChild(this.domElement);
    }

    setClickHandler(callback){
        this.domElement.onclick = () => callback(this);
    }
}

class Board {
    constructor(columns, playerColor) {
        this.boardElement = document.getElementById("board");
        this.columns = columns;
        this.rows = 4;
        this.currentPlayer = playerColor;
        this.cells = Array.from({ length: this.rows }, () => Array(columns).fill(null));
        this.pieces = new Array(columns * this.rows).fill(null);

        this.showBoard();
    }

    newBoard(columns, playerColor){
        this.boardElement.innerHTML = "";
        this.columns = columns;
        this.rows = 4;
        this.currentPlayer = playerColor;
        this.cells = Array.from({ length: this.rows }, () => Array(columns).fill(null));
        this.pieces = new Array(columns * this.rows).fill(null);

        this.showBoard();
    }

    showBoard(){
        this.boardElement.style.gridTemplateColumns = `repeat(${this.columns}, 56px)`;
        this.boardElement.style.gridTemplateRows = `repeat(${this.rows}, 56px)`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                let cell = document.createElement("div");
                cell.classList.add("cell");
                this.boardElement.appendChild(cell);
                this.cells[row][col] = cell;

                if (row === 0){
                    let piece = new Piece("red");
                //    piece.animate(cell);
                    this.pieces[row * this.columns + col] = piece;
                }
                else if (row === this.rows - 1){
                    let piece = new Piece("blue");
                //    piece.animate(cell);
                    this.pieces[row * this.columns + col] = piece;
                }
            }
        }
        this.showPieces();
    }

    showPieces() {
        // remove existing pieces from cells first to avoid duplicates
        this.boardElement.querySelectorAll('.piece').forEach(p => p.remove());

        for (let idx = 0; idx < this.pieces.length; idx++) {
            const piece = this.pieces[idx];
            if (!piece) continue;

            const row = Math.floor(idx / this.columns);
            const col = idx % this.columns;
            const cell = this.cells[row][col];
            piece.animate(cell);
        }
    }

    showMessage(text){
        const messageBox = document.getElementById("message-box");
        messageBox.textContent = text;
    }
}

// ================== DICE CLASS ==================
class Dice {
    constructor(onRoll) {
        // Verbinde HTML-Elemente mit der Klasse
        this.rollButton = document.getElementById("rollDiceBtn");
        this.diceImage = document.getElementById("dice-image");
        this.messageBox = document.getElementById("message-box");


        // Das Ergebnis des letzten Wurfs
        this.result = null;

        this.onRoll = onRoll;

        if (this.rollButton) {
            this.rollButton.addEventListener("click", () => this.rollDice());
        }
    }

    // === Würfelfunktion mit Wahrscheinlichkeitsverteilung ===
    rollWeightedDice() {
        const probabilities = [0.06, 0.25, 0.38, 0.25, 0.06]; // Wahrscheinlichkeit für 0–4
        const random = Math.random();
        let cumulative = 0;

        for (let i = 0; i < probabilities.length; i++) {
            cumulative += probabilities[i];
            if (random < cumulative) return i;
        }
        return probabilities.length - 1;
    }

    // === Hauptmethode: Würfeln + Anzeige aktualisieren ===
    rollDice() {
        this.result = this.rollWeightedDice(); // speichere das Ergebnis
        this.updateDiceImage();
        this.message();

        let steps = this.result === 0 ? 6 : this.result;

        if (this.onRoll) this.onRoll(steps);
    }

    // === Hilfsmethode: Bild entsprechend Ergebnis ändern ===
    updateDiceImage() {
        if (this.diceImage) {
            this.diceImage.src = `images/dice_${this.result}.png`;
        }
    }

    // === Hilfsmethode: Nachricht im UI anzeigen ===
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

        this.messageBox.textContent = message;
    }
}


class Game {
    constructor(rows, playerColor){
        this.board = new Board(rows, playerColor);
        this.dice = new Dice((result) => this.onDiceRolled(result));
        this.diceResult = null;
        this.extraMove = false; // für Würfe 0,1,4
        this.board.showMessage(`${this.board.currentPlayer} starts! Roll the dice.`);
    }

    // === Würfelergebnis erhalten ===
    onDiceRolled(result) {
        this.diceResult = result;

        if (result === 1 || result === 4 || result === 6) {
            this.extraMove = true; // Spieler darf weiterspielen
            this.board.showMessage(`${this.board.currentPlayer} rolled ${result}. Move a piece and then roll again!`);
        } else if (result === 2 || result === 3) {
            this.extraMove = false; // Zug endet nach dem nächsten Move
            this.board.showMessage(`${this.board.currentPlayer} rolled ${result}. Move a piece, then turn ends.`);
        }

        this.enablePieceClicks();
    }

    // === Aktivieren der Pieces für Klicks ===
    enablePieceClicks() {
        this.board.pieces.forEach(piece => {
            if (piece) {
                piece.setClickHandler((clickedPiece) => this.onPieceClicked(clickedPiece));
            }
        });
    }

    // === Deaktivieren der Pieces ===
    disablePieceClicks() {
        this.board.pieces.forEach(piece => {
            if(piece) piece.domElement.onclick = null;
        });
    }

    // === Aufruf beim Klick auf ein Piece ===
    async onPieceClicked(piece) {
        if (piece.color !== this.board.currentPlayer) {
            this.board.showMessage("You can't move pieces of the opponent!");
            return;
        }

        if (this.diceResult === null) {
            this.board.showMessage("Roll the dice first!");
            return;
        }

        let destination = this.getDestination(piece);

        const targetPiece = this.board.pieces[destination];
        if (targetPiece && targetPiece.color !== this.board.currentPlayer) {
            targetPiece.domElement.remove();
        } else if (targetPiece && targetPiece.color === this.board.currentPlayer) {
            this.board.showMessage("You can't move onto your own piece!");
            return;
        }

        const choices = this.decidingPoint(piece);

        if (choices) {
            
            choices.forEach(idx => {
                const cell = this.board.cells[Math.floor(idx / this.board.columns)][idx % this.board.columns];
                cell.classList.add("highlight");
                cell.onclick = () => {
                    this.disableHighlights();
                    this.movePieceForward(piece, idx);
                };
            });
        } else {
            this.movePieceForward(piece, destination);
        }

        this.disablePieceClicks();

        if (!this.checkWinCondition()) return;

        // Zugende oder weiterspielen
        if (this.diceResult === 2 || this.diceResult === 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.switchTurn();
            this.diceResult = null;
            this.board.showMessage(`${this.board.currentPlayer}'s turn! Roll the dice.`);
        } else if (this.extraMove) {
            this.diceResult = null; // für neuen Wurf
            this.board.showMessage(`${this.board.currentPlayer} can roll again!`);
        }
    }

    decidingPoint(piece) {
        // Aktuellen Index des Pieces im Array finden
        const index = this.board.pieces.indexOf(piece);
        if (index === -1) return null;

        const row = Math.floor(index / this.board.columns);

        // Normale Destination über getDestination berechnen (du musst getDestination übergeben oder Board kennt steps)
        const destination = this.getDestination(piece);


        // --- Blau Entscheidungslogik ---
        // Blau: Entscheidung am Übergang von Reihe 1 nach 0
        if (piece.color === "blue" && row === 1 && Math.floor(destination / this.board.columns) === 0) {
            return [destination, destination + 2 * this.board.columns];
        }

        // --- Rot Entscheidungslogik ---
        // Rot: Entscheidung am Übergang von Reihe 2 nach 3
        if (piece.color === "red" && row === 2 && Math.floor(destination / this.board.columns) === 3) {
            return [destination, destination - 2 * this.board.columns];
        }

        // Kein Entscheidungsfall
        return null;
    }

    checkWinCondition() {
        let hasRed = false, hasBlue = false;

        for (let piece of this.board.pieces) {
            if (piece) {
                if (piece.color === "red") hasRed = true;
                if (piece.color === "blue") hasBlue = true;
            }
        }

        if (!hasRed) {
            this.board.showMessage("Blue wins!");
            return false;
        } else if (!hasBlue) {
            this.board.showMessage("Red wins!");
            return false;
        }
        return true;
    }

    getDestination(piece) {
        // Find the current index of the selected piece in the board's piece array
        if(this.diceResult === null) return;
        let steps = this.diceResult;
        const index = this.board.pieces.indexOf(piece);
        if (index === -1) return; // Safety check: if the piece is not found, exit the function

        // Calculate the current row and column of the piece based on its index
        let row = Math.floor(index / this.board.columns);
        let col = index % this.board.columns;

        // Loop until the number of movement steps is exhausted
        while (steps > 0) {
            if (piece.color === "blue") {
                // --- BLUE PLAYER MOVEMENT ---
                // Movement direction alternates each row to create a "snake-like" pattern.
                // On even-numbered rows: move left (decrease column index).
                // On odd-numbered rows: move right (increase column index).
                if (row % 2 === 0) col--; else col++;

                // If the piece moves beyond the right boundary of the board (too far right),
                // set it to the last column and move one row upward (row--).
                if (col >= this.board.columns) { 
                    col = this.board.columns - 1; 
                    row--; 
                }

                // If the piece moves beyond the left boundary of the board (too far left),
                // set it to the first column and move one row upward (row--).
                if (col < 0) { 
                    col = 0;
                    if(row === 0) {
                        row++;
                    } else {
                        row--;
                    } 
                }
            } else { 
                // --- RED PLAYER MOVEMENT ---
                // Same horizontal pattern (snake-like) as blue,
                // but moves vertically downward instead of upward.
                if (row % 2 === 0) col--; else col++;

                // If the piece moves beyond the right boundary, correct it and move one row down (row++).
                if (col >= this.board.columns) { 
                    col = this.board.columns - 1;
                    if (row === 3) {
                        row--;
                    } else {
                        row++; 
                    } 
                }

                // If the piece moves beyond the left boundary, correct it and move one row down (row++).
                if (col < 0) { 
                    col = 0;
                    row++;
                }
            }
            // Decrease the step count after each movement
            steps--;
        }

        // Return the calculated destination index (row * number of columns + column index)
        return row * this.board.columns + col;
    }


    movePieceForward(piece, destination){
        const index = this.board.pieces.indexOf(piece);
        let row = Math.floor(destination / this.board.columns);
        let col = destination % this.board.columns;

        this.board.pieces[index] = null;
        this.board.pieces[destination] = piece;

        const cell = this.board.cells[row][col];
        piece.animate(cell);
    }

    disableHighlights() {
        this.board.cells.flat().forEach(cell => {
            cell.classList.remove("highlight");
            cell.onclick = null;
        });
    }

    switchTurn(){
        this.board.currentPlayer = this.board.currentPlayer === "blue" ? "red" : "blue";
        if (this.board.currentPlayer === 'red') {
            this.board.boardElement.classList.add('flipped');
        } else {
            this.board.boardElement.classList.remove('flipped');
        }
        this.board.showMessage(`${this.board.currentPlayer}'s turn! Roll the dice.`);
    }
}


document.addEventListener("DOMContentLoaded", () => {

    //Generate initial standard Board
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
