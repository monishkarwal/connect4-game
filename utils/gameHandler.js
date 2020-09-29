let lobby = [];

const generateRandomHash = (length) => {
  const haystack =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let output = "";
  for (let i = 0; i < length; i++) {
    output =
      output + haystack.charAt(Math.floor(Math.random() * haystack.length));
  }
  return output;
};

const createNewLobby = (socket) => {
  let gameData = {
    id: generateRandomHash(6),
    players: [],
    count: 0,
    isFull: false,
    gameStatus: false,
    turnPlayer1: true,
    turnPlayer2: false,
    board: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
  };
  gameData.players.push({ player1: socket.id, color: "Yellow" });
  gameData.count = 1;
  socket.emit("room", { ...gameData });
  lobby.push(gameData);
};

const checkWinner = (board, color) => {
  // Horizontal win
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 6; row++) {
      if (
        board[row][col] == color &&
        board[row][col + 1] == color &&
        board[row][col + 2] == color &&
        board[row][col + 3] == color
      ) {
        return true;
      }
    }
  }
  // Vertical win
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row < 3; row++) {
      if (
        board[row][col] == color &&
        board[row + 1][col] == color &&
        board[row + 2][col] == color &&
        board[row + 3][col] == color
      ) {
        return true;
      }
    }
  }
  // Diagonal win
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 3; row++) {
      if (
        board[row][col] == color &&
        board[row + 1][col + 1] == color &&
        board[row + 2][col + 2] == color &&
        board[row + 3][col + 3] == color
      ) {
        return true;
      }
    }
  }
  // Diagonal win
  for (let col = 0; col < 4; col++) {
    for (let row = 3; row < 6; row++) {
      if (
        board[row][col] == color &&
        board[row - 1][col + 1] == color &&
        board[row - 2][col + 2] == color &&
        board[row - 3][col + 3] == color
      ) {
        return true;
      }
    }
  }
};

const gameHandler = (socket) => {
  if (lobby.length == 0) {
    // Create new lobby and assign player 1 data
    createNewLobby(socket);
  } else {
    let lobbyCount = lobby.length - 1;
    if (lobby[lobbyCount].isFull) {
      console.log("All rooms full, creating new lobby...");
      createNewLobby(socket);
    } else {
      console.log("Found empty lobby, adding player 2..");
      lobby[lobbyCount].count = 2;
      lobby[lobbyCount].players.push({ player2: socket.id, color: "Red" });
      lobby[lobbyCount].isFull = true;
      lobby[lobbyCount].gameStatus = true;
      socket.emit("room", { ...lobby[lobbyCount] });
      socket.broadcast.emit("updateState", { ...lobby[lobbyCount] });
    }
  }

  socket.on("move", (data) => {
    console.log(data);
    let index = lobby.findIndex((room) => room.id == data.roomId);
    // console.log("found target state at " + index);
    if (index >= 0) {
      lobby[index].turnPlayer1 = !lobby[index].turnPlayer1;
      lobby[index].turnPlayer2 = !lobby[index].turnPlayer2;

      let column = data.column;
      // Add piece at correct location
      for (let idx = 5; idx >= 0; idx--) {
        if (lobby[index].board[idx][column] == 0) {
          lobby[index].board[idx][column] = data.color;
          break;
        }
      }

      // Check if someone won game
      let redWin = checkWinner(lobby[index].board, "red");
      let yellowWin = checkWinner(lobby[index].board, "yellow");
      if (redWin) {
        socket.emit("gameOver", { id: lobby[index].id, winner: "red" });
        socket.broadcast.emit("gameOver", {
          id: lobby[index].id,
          winner: "red",
        });
      } else if (yellowWin) {
        socket.emit("gameOver", { id: lobby[index].id, winner: "yellow" });
        socket.broadcast.emit("gameOver", {
          id: lobby[index].id,
          winner: "yellow",
        });
      }

      // If none won send move data
      if (!redWin && !yellowWin)
        socket.broadcast.emit("moveMade", {
          ...lobby[index],
        });
    }
  });

  socket.on("sendBoard", () => {
    socket.emit("latestData", [...lobby]);
  });

  socket.on("tabClosed", (data) => {
    socket.emit("playerLeft", { id: data.id });
    socket.broadcast.emit("playerLeft", { id: data.id });
    lobby = lobby.filter((room) => room.id !== data.id);
  });

  socket.on("disconnect", (data) => {
    console.log("Player left...");
  });
};

module.exports = gameHandler;
