document.addEventListener("DOMContentLoaded", () => {

      // creates values to store references to html elements
      const board = document.getElementById("board");
      const colsInput = document.getElementById("cols");
      const resetBtn = document.getElementById("resetBtn");

      // function to generate initial board
      function generate_board(colunas = 9, linhas = 4) {
        board.innerHTML = ""; // clears board
        // defines the layout of the board as a grid
        board.style.gridTemplateColumns = `repeat(${colunas}, 80px)`;
        board.style.gridTemplateRows = `repeat(${linhas}, 80px)`;

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
    });