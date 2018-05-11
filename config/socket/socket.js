/* eslint-disable */

const Game = require('./game');
const Player = require('./player');
require('console-stamp')(console, 'm/dd HH:MM:ss');
const mongoose = require('mongoose');

const User = mongoose.model('User');

const avatars = require(`${__dirname}/../../app/controllers/avatars.js`).all();
// Valid characters to use to generate random private game IDs
const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

module.exports = function (io) {
  let game;
  const allGames = {};
  const allPlayers = {};
  const gamesNeedingPlayers = [];
  let gameID = 0;
  let onlineUsers = [];
  let verifyUsers = [];

  io.sockets.on('connection', (socket) => {
    console.log(`${socket.id} Connected`);
    socket.emit('id', { id: socket.id });

    socket.on('pickCards', (data) => {
      console.log(socket.id, 'picked', data);
      if (allGames[socket.gameID]) {
        allGames[socket.gameID].pickCards(data.cards, socket.id);
      } else {
        console.log('Received pickCard from', socket.id, 'but game does not appear to exist!');
      }
    });

    socket.on('pickWinning', (data) => {
      if (allGames[socket.gameID]) {
        allGames[socket.gameID].pickWinning(data.card, socket.id);
      } else {
        console.log('Received pickWinning from', socket.id, 'but game does not appear to exist!');
      }
    });

    socket.on('joinGame', (data) => {
      if (!allPlayers[socket.id]) {
        joinGame(socket, data);
      }
    });

    socket.on('onlineUsers', () => {
      console.log(onlineUsers)
      socket.emit('online', onlineUsers);
    });

    socket.on('pushNotification', (data) => {
      const { msg, url, sender } = data;
      io.sockets.socket(data.socketId).emit('sendNotification', { msg, url, sender});
    });

    socket.on('pushSent', (data) => {
      console.log('fhjhfdkhfldfdf****>>>')
      socket.to(data.id).emit('sendConfirmation');
    });

    socket.on('joinNewGame', (data) => {
      console.log('test test345')
      exitGame(socket);
      joinGame(socket, data);
    });

    socket.on('startGame', () => {
      if (allGames[socket.gameID]) {
        const thisGame = allGames[socket.gameID];
        console.log('comparing', thisGame.players[0].socket.id, 'with', socket.id);
        if (thisGame.players.length >= thisGame.playerMinLimit) {
          // Remove this game from gamesNeedingPlayers so new players can't join it.
          gamesNeedingPlayers.forEach((game, index) => {
            if (game.gameID === socket.gameID) {
              return gamesNeedingPlayers.splice(index, 1);
            }
          });
          thisGame.prepareGame();
          thisGame.sendNotification('The game has begun!');
        }
      }
    });

    socket.on('leaveGame', () => {
      exitGame(socket);
    });

    socket.on('searchError', (data) => {
      socket.to(data.id).emit('searchErr');
    });

    socket.on('inviteSuccessful', (data) => {
      socket.to(data.id).emit('inviteSuccess');
    });

    socket.on('startError', (data) => {
      socket.to(data.id).emit('err');
    });

    socket.on('search', (data) => {
      socket.to(data.id).emit('searchSuccess', { user: data.user });
    });

    socket.on('disconnect', () => {
      console.log('Rooms on Disconnect ', io.sockets.manager.rooms);
      exitGame(socket);
    });
  });

  const joinGame = function (socket, data) {
    const player = new Player(socket);
    data = data || {};
    player.userID = data.userID || 'unauthenticated';
    if (data.userID !== 'unauthenticated') {
      User.findOne({
        _id: data.userID
      }).exec((err, user) => {
        if (err) {
          console.log('err', err);
          return err; // Hopefully this never happens.
        }
        if (!user) {
          // If the user's ID isn't found (rare)
          player.username = 'Guest';
          player.avatar = avatars[Math.floor(Math.random() * 4) + 12];
        } else {
          if(verifyUsers.indexOf(user.name) === -1){
            onlineUsers.push({id: socket.id, name: user.name})
            verifyUsers.push(user.name);
            socket.emit('updateOnlineUsers', onlineUsers);
          }
          console.log(verifyUsers);
          player.username = user.name;
          player.id = user._id;
          player.premium = user.premium || 0;
          player.avatar = user.avatar || data.avatar || avatars[Math.floor(Math.random() * 4) + 12];
        }
        getGame(player, socket, data.room, data.createPrivate, data.timing, data.regId);
      });
    } else {
      // If the user isn't authenticated (guest)
      player.username = 'Guest';
      player.avatar = avatars[Math.floor(Math.random() * 4) + 12];
      getGame(player, socket, data.room, data.createPrivate, data.timing, data.regId);
    }
  };

  const getGame = function (player, socket, requestedGameId, createPrivate, timing, regId) {
    requestedGameId = requestedGameId || '';
    createPrivate = createPrivate || false;
    console.log(socket.id, 'is requesting room', requestedGameId);
    if (requestedGameId.length && allGames[requestedGameId]) {
      // console.log('Room', requestedGameId, 'is valid');
      const game = allGames[requestedGameId];
      // Ensure that the same socket doesn't try to join the same game
      // This can happen because we rewrite the browser's URL to reflect
      // the new game ID, causing the view to reload.
      // Also checking the number of players, so node doesn't crash when
      // no one is in this custom room.
      if (game.state === 'awaiting players' && (!game.players.length ||
        game.players[0].socket.id !== socket.id)) {
        // Put player into the requested game
        allPlayers[socket.id] = true;
        game.players.push(player);
        socket.join(game.gameID);
        socket.gameID = game.gameID;
        game.assignPlayerColors();
        game.assignGuestNames(socket.id, verifyUsers, onlineUsers);
        game.sendUpdate();
        const gamers = new Game(game.gameID, io);
        gamers.updateOnlineUsers(onlineUsers);
        game.sendNotification(`${player.username} has joined the game!`);
        if (game.players.length >= game.playerMaxLimit) {
          gamesNeedingPlayers.shift();
          game.prepareGame();
        }
      } else {
        socket.to(socket.id).emit('started');
      }
    } else {
      // Put players into the general queue
      console.log('Redirecting player', socket.id, 'to general queue');
      if (createPrivate) {
        createGameWithFriends(player, socket, timing, regId);
      } else {
        fireGame(player, socket, regId);
      }
    }
  };

  const fireGame = function (player, socket, regId) {
    let game;
    if (gamesNeedingPlayers.length <= 0) {
      gameID += 1;
      const gameIDStr = gameID.toString();
      game = new Game(gameIDStr, io);
      allPlayers[socket.id] = true;
      game.players.push(player);
      allGames[gameID] = game;
      game.regionId = regId;
      gamesNeedingPlayers.push(game);
      socket.join(game.gameID);
      socket.gameID = game.gameID;
      console.log(socket.id, 'has joined newly created game', game.gameID);
      game.assignPlayerColors();
      game.assignGuestNames(socket.id, verifyUsers, onlineUsers);
      console.log('heyyyo1', verifyUsers, onlineUsers)
      game.updateOnlineUsers(onlineUsers);
      game.sendUpdate();
    } else {
      game = gamesNeedingPlayers[0];
      allPlayers[socket.id] = true;
      game.players.push(player);
      console.log(socket.id, 'has joined game', game.gameID);
      socket.join(game.gameID);
      socket.gameID = game.gameID;
      game.assignPlayerColors();
      game.assignGuestNames(socket.id, verifyUsers, onlineUsers);
      game.sendUpdate();
      game.updateOnlineUsers(onlineUsers);
      game.sendNotification(`${player.username} has joined the game!`);
      if (game.players.length >= game.playerMaxLimit) {
        gamesNeedingPlayers.shift();
        game.prepareGame();
      }
    }
  };

  const createGameWithFriends = function (player, socket, timing, regId) {
    let isUniqueRoom = false;
    let uniqueRoom = '';
    // Generate a random 6-character game ID
    while (!isUniqueRoom) {
      uniqueRoom = '';
      for (let i = 0; i < 6; i++) {
        uniqueRoom += chars[Math.floor(Math.random() * chars.length)];
      }
      if (!allGames[uniqueRoom] && !(/^\d+$/).test(uniqueRoom)) {
        isUniqueRoom = true;
      }
    }
    console.log(socket.id, 'has created unique game', uniqueRoom);
    const game = new Game(uniqueRoom, io);
    allPlayers[socket.id] = true;
    game.players.push(player);
    game.timeLimits.stateChoosing = timing;
    game.regionId = regId;
    allGames[uniqueRoom] = game;
    socket.join(game.gameID);
    socket.gameID = game.gameID;
    game.assignPlayerColors();
    game.assignGuestNames(socket.id, verifyUsers, onlineUsers);
    game.updateOnlineUsers(onlineUsers);
    game.sendUpdate();
  };

  const exitGame = function (socket) {
    console.log(socket.id, 'has disconnected');
    if (allGames[socket.gameID]) { // Make sure game exists
      const game = allGames[socket.gameID];
      console.log(socket.id, 'has left game', game.gameID);
      onlineUsers.map((val, index) => {
        if(val.id === socket.id){
          onlineUsers.splice(index, 1);
          verifyUsers.splice(verifyUsers.indexOf(val.name), 1);
        }
      })
      const gamers = new Game(game.gameID, io);
      gamers.updateOnlineUsers(onlineUsers);
      // console.log('bye!!!!!!!!!', verifyUsers)
      delete allPlayers[socket.id];
      if (game.state === 'awaiting players' ||
        game.players.length - 1 >= game.playerMinLimit) {
        game.removePlayer(socket.id);
      } else {
        game.stateDissolveGame();
        for (let j = 0; j < game.players.length; j++) {
          game.players[j].socket.leave(socket.gameID);
        }
        game.killGame();
        delete allGames[socket.gameID];
      }
    }
    socket.leave(socket.gameID);
  };
};
