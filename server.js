// Common Modules
const http = require("http");
const express = require("express");
const cors = require("cors");
const socket = require("socket.io");

// Middleware
const errorHandler = require("./middleware/errorHandler");
const gameHandler = require("./utils/gameHandler");

// App instance and configuration
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(errorHandler);
app.use(express.static("public"));

// Configure PORT
const port = process.env.PORT || 8000;
const server = http.createServer(app);

// Create socket
const io = socket(server);

// Assign socket to game handler
io.on("connection", (socket) => {
  gameHandler(socket);
});

server.listen(port);
server.on("listening", () => {
  console.log(`Server Listening on port: ${port}`);
});
