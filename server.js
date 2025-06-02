const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

let games = {};

io.on('connection', (socket) => {
  socket.on('createGame', (word, callback) => {
    const code = Math.random().toString(36).substr(2, 5).toUpperCase();
    games[code] = { word: word.toLowerCase(), guesses: [], wrong: [] };
    socket.join(code);
    callback(code);
  });

  socket.on('joinGame', (code, callback) => {
    if (games[code]) {
      socket.join(code);
      callback(true);
    } else {
      callback(false);
    }
  });

  socket.on('guessLetter', ({ code, letter }) => {
    const game = games[code];
    if (!game || game.guesses.includes(letter)) return;

    game.guesses.push(letter);
    if (!game.word.includes(letter)) {
      game.wrong.push(letter);
    }

    io.to(code).emit('updateGame', {
      word: game.word,
      guesses: game.guesses,
      wrong: game.wrong
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
