let roomId = "";
let gameState = {};

const gameBoard = document.getElementById("game-board");
const columnButtons = document.getElementById("column-buttons");

for (let index = 0; index <= 6; index++) {
  let button = document.createElement("button");
  button.innerText = index + 1;
  button.setAttribute("class", "btn");
  button.setAttribute("data-column", index);
  button.addEventListener("click", function () {
    socket.emit("move", {
      roomId,
      column: this.dataset.column,
      color: getPlayerColor(),
    });
    let turn = document.getElementById("player-turn");
    turn.innerHTML = "";
    disableButtons();
    getLatestData();
  });
  columnButtons.appendChild(button);
  disableButtons();
}

for (let row = 0; row < 6; row++) {
  for (let col = 0; col < 7; col++) {
    let cell = document.createElement("div");
    cell.setAttribute("class", `cell row-${row} col-${col}`);
    cell.setAttribute("data-row", row);
    cell.setAttribute("data-col", col);
    cell.addEventListener("click", function () {
      console.log(this.dataset.row, this.dataset.col);
    });
    gameBoard.appendChild(cell);
  }
  gameBoard.appendChild(document.createElement("br"));
}

function setupData(data) {
  // Check if room exist and create new if it does not exist
  if (!roomId) {
    roomId = gameState.id;
    let lobbyId = document.getElementById("lobbyId");
    lobbyId.innerHTML = gameState.id;
    let player1Color = document.getElementById("player1-color");
    player1Color.innerHTML = gameState.players[0].color;
    let player2Color = document.getElementById("player2-color");
    player2Color.innerHTML = "Waiting...";
  }
  // If room exists, add player 2
  if (roomId && gameState.count == 2) {
    let player1Color = document.getElementById("player1-color");
    let player2Color = document.getElementById("player2-color");
    let gameStatus = document.getElementById("gameStatus");
    player1Color.innerHTML = gameState.players[0].color;
    player2Color.innerHTML = gameState.players[1].color;
    gameStatus.innerHTML = gameState.gameStatus ? "Started" : "Waiting...";
  }
}

function enableButtons() {
  let allButtons = document.querySelectorAll(".btn");
  for (let button of allButtons) {
    button.disabled = false;
  }
}
function disableButtons() {
  let allButtons = document.querySelectorAll(".btn");
  for (let button of allButtons) {
    button.disabled = true;
  }
}

function checkTurn(data) {
  let turn = document.getElementById("player-turn");
  if (gameState.turnPlayer1) {
    turn.innerHTML = "Your Move";
    enableButtons();
  } else if (gameState.turnPlayer2) {
    turn.innerHTML = "Your Move";
    enableButtons();
  }
}

function getPlayerColor() {
  if (gameState.turnPlayer1) {
    return "yellow";
  } else if (gameState.turnPlayer2) {
    return "red";
  }
}
function getLatestData() {
  socket.emit("sendBoard");
}

const socket = io();

socket.on("room", (data) => {
  gameState = data;
  setupData();
});

socket.on("updateState", (data) => {
  if (data.id == roomId) {
    gameState = data;
    setupData();
    checkTurn();
  }
});

socket.on("moveMade", (data) => {
  if (data.id == roomId) {
    gameState = data;
    socket.emit("sendBoard");
    checkTurn();
  }
});

socket.on("latestData", (data) => {
  let latestGameData = data.filter((room) => room.id == roomId);
  let board = latestGameData[0].board;

  // console.log("Board Data");
  // console.log(board);

  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 7; col++) {
      if (board[row][col] == "red") {
        let cell = document.getElementsByClassName(`row-${row} col-${col}`)[0];
        cell.classList.add("red");
      } else if (board[row][col] == "yellow") {
        let cell = document.getElementsByClassName(`row-${row} col-${col}`)[0];
        cell.classList.add("yellow");
      }
    }
  }
});

socket.on("gameOver", (data) => {
  if (data.id == roomId) {
    if (data.winner == "red") {
      document.body.innerHTML = "";
      let winner = document.createElement("div");
      winner.setAttribute("class", "winner");
      winner.innerHTML = "Red Won! ";
      document.body.appendChild(winner);
    } else if (data.winner == "yellow") {
      document.body.innerHTML = "";
      let winner = document.createElement("div");
      winner.setAttribute("class", "winner");
      winner.innerHTML = "Yellow Won! ";
      document.body.appendChild(winner);
    }
  }
});

socket.on("playerLeft", (data) => {
  if (data.id == roomId) {
    document.body.innerHTML = "";
    let domMessage = document.createElement("div");
    domMessage.setAttribute("class", "winner");
    domMessage.innerHTML = "Player left! Please close tab.";
    document.body.appendChild(domMessage);
  }
});

window.onbeforeunload = function () {
  socket.emit("tabClosed", { id: roomId });
};
