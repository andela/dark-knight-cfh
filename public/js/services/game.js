angular.module('mean.system').factory('game', [
  'socket',
  '$http',
  '$location',
  '$timeout',
  function (socket, $http, $location, $timeout) {
    const game = {
      id: null, // This player's socket ID, so we know who this player is
      gameID: null,
      owner: null,
      players: [],
      playerIndex: 0,
      winningCard: -1,
      winningCardPlayer: -1,
      gameWinner: -1,
      table: [],
      czar: null,
      playerMinLimit: 3,
      playerMaxLimit: 6,
      pointLimit: null,
      state: null,
      round: 0,
      time: 0,
      curQuestion: null,
      level: '',
      notification: null,
      timeLimits: {},
      joinOverride: false,
      errorMessage: '',
      gameStarted: '',
      allUsers: [],
      regId: null,
      inviteSent: false
    };

    const notificationQueue = [];
    let timeout = false;
    const self = this;
    let joinOverrideTimeout = 0;
    let timing;

    const gameStarted = function () {
      game.gameStarted = 'Only a max of 12 persons allowed per game';
    };

    const allUsers = function (data) {

      game.allUsers = data.user;
    };

    const setNotification = function () {
      if (notificationQueue.length === 0) {
        // If notificationQueue is empty, stop
        clearInterval(timeout);
        timeout = false;
        game.notification = '';
      } else {
        game.notification = notificationQueue.shift(); // Show a notification and check again in a bit
        timeout = $timeout(setNotification, 1300);
      }
    };

    const addToNotificationQueue = function (msg) {
      notificationQueue.push(msg);
      if (!timeout) {
        // Start a cycle if there isn't one
        setNotification();
      }
    };

    let timeSetViaUpdate = false;
    const decrementTime = function () {
      if (game.time > 0 && !timeSetViaUpdate) {
        game.time--;
      } else {
        timeSetViaUpdate = false;
      }
      $timeout(decrementTime, 950);
    };

    socket.on('id', (data) => {
      game.id = data.id;
    });

    socket.on('prepareGame', (data) => {
      game.playerMinLimit = data.playerMinLimit;
      game.playerMaxLimit = data.playerMaxLimit;
      game.pointLimit = data.pointLimit;
      game.timeLimits = data.timeLimits;
    });

    socket.on('gameUpdate', (data) => {
      // Update gameID field only if it changed.
      // That way, we don't trigger the $scope.$watch too often
      if (game.gameID !== data.gameID) {
        game.gameID = data.gameID;
      }

      game.joinOverride = false;
      clearTimeout(game.joinOverrideTimeout);

      let i;
      // Cache the index of the player in the players array
      for (i = 0; i < data.players.length; i++) {
        if (game.id === data.players[i].socketID) {
          game.playerIndex = i;
        }
      }

      const newState = data.state !== game.state;

      // Handle updating game.time
      if (data.round !== game.round && data.state !== 'awaiting players' && data.state !== 'game ended' && data.state !== 'game dissolved') {
        game.time = game.timeLimits.stateChoosing - 1;
        timeSetViaUpdate = true;
      } else if (newState && data.state === 'waiting for czar to decide') {
        game.time = game.timeLimits.stateJudging - 1;
        timeSetViaUpdate = true;
      } else if (newState && data.state === 'winner has been chosen') {
        game.time = game.timeLimits.stateResults - 1;
        timeSetViaUpdate = true;
      }

      // Set these properties on each update
      game.round = data.round;
      game.winningCard = data.winningCard;
      game.winningCardPlayer = data.winningCardPlayer;
      game.winnerAutopicked = data.winnerAutopicked;
      game.gameWinner = data.gameWinner;
      game.pointLimit = data.pointLimit;

      // Handle updating game.table
      if (data.table.length === 0) {
        game.table = [];
      } else {
        const added = _.difference(_.pluck(data.table, 'player'), _.pluck(game.table, 'player')); /* eslint-disable-line */
        const removed = _.difference(_.pluck(game.table, 'player'), _.pluck(data.table, 'player')); /* eslint-disable-line */
        for (i = 0; i < added.length; i++) {
          for (let j = 0; j < data.table.length; j++) {
            if (added[i] === data.table[j].player) {
              game.table.push(data.table[j], 1);
            }
          }
        }
        for (i = 0; i < removed.length; i++) {
          for (let k = 0; k < game.table.length; k++) {
            if (removed[i] === game.table[k].player) {
              game.table.splice(k, 1);
            }
          }
        }
      }

      if (game.state !== 'waiting for players to pick' || game.players.length !== data.players.length) {
        game.players = data.players;
      }

      if (newState || game.curQuestion !== data.curQuestion) {
        game.state = data.state;
      }

      if (data.state === 'waiting for players to pick') {
        game.czar = data.czar;
        game.curQuestion = data.curQuestion;
        // Extending the underscore within the question
        game.curQuestion.text = data.curQuestion.text.replace(/_/g, '______');

        // Set notifications only when entering state
        if (newState) {
          if (game.czar === game.playerIndex) {
            addToNotificationQueue("You're the Card Czar! Please wait!");
          } else if (game.curQuestion.numAnswers === 1) {
            addToNotificationQueue('Select an answer!');
          } else {
            addToNotificationQueue('Select TWO answers!');
          }
        }
      } else if (data.state === 'waiting for czar to decide') {
        if (game.czar === game.playerIndex) {
          addToNotificationQueue("Everyone's done. Choose the winner!");
        } else {
          addToNotificationQueue('The czar is contemplating...');
        }
      } else if (data.state === 'winner has been chosen' && game.curQuestion.text.indexOf('______') > -1) {
        game.curQuestion = data.curQuestion;
      } else if (data.state === 'awaiting players') {
        joinOverrideTimeout = $timeout(() => {
          game.joinOverride = true;
        }, 15000);
      } else if (data.state === 'game dissolved' || data.state === 'game ended') {
        game.players[game.playerIndex].hand = [];
        game.time = 0;
      }
    });

    socket.on('notification', (data) => {
      addToNotificationQueue(data.notification);
    });

    socket.on('started', () => {
      gameStarted();
    });

    game.joinGame = function (mode, room, createPrivate) {
      const level = localStorage.getItem('level');
      const { regId } = game;
      if (level === 'beginner') {
        timing = 30;
      } else if (level === 'intermidiate') {
        timing = 20;
      } else if (level === 'legend') {
        timing = 15;
      }
      mode = mode || 'joinGame';
      room = room || '';
      createPrivate = createPrivate || false;
      const userID = window.user ? user._id || user.id : 'unauthenticated';
      const avatar = user ? user.avatar : 'avatar';
      socket.emit(mode, {
        userID,
        avatar,
        room,
        createPrivate,
        timing,
        regId
      });
    };

    game.saveGame = function (winner, players, gameId) {
      const level = localStorage.getItem('level');
      $http({
        method: 'POST',
        url: `/api/games/${gameId}/start`,
        data: { winner, players, level }
      }).then(
        (response) => {
          // console.log('operation was successful', response);
        },
        (error) => {
          // console.log('An error occured', error);
        }
      );
    };

    socket.on('owner', (data) => {
      game.owner = data.id;
    });

    socket.on('inviteSuccess', () => {
      game.inviteSent = true;
      game.allUsers = [];
      setTimeout(() => {
        game.inviteSent = false;
      }, 2000);
    });

    socket.on('searchErr', () => {
      game.allUsers = [];
    });

    socket.on('searchSuccess', (data) => {
      allUsers(data.user);
    });

    socket.on('err', () => {
      game.errorMessage = 'A minimum of 3 players is required to play the game!';
      setTimeout(() => {
        game.errorMessage = '';
      }, 2000);
    });

    game.startGame = function (players, id) {
      if (players < 3) {
        socket.emit('startError', { id });
      } else {
        socket.emit('startGame');
      }
    };

    game.closeErrMsg = function () {
      game.errorMessage = '';
    };

    game.searchUser = function (name, playerInfo) {
      const { username } = playerInfo.players[playerInfo.playerIndex];
      $http({
        method: 'POST',
        url: '/api/search/users',
        data: { username: name, value: username }
      }).then(
        (response) => {
          const user = response.data;
          socket.emit('search', { user, id: playerInfo.id });
        },
        (error) => {
          socket.emit('searchError', { id: playerInfo.id });
        }
      );
    };

    game.send = function () {
      console.log('running sendfunct...');
      const x = document.getElementById('snackbar'); /* eslint-disable-line */
      x.className = 'show';
      setTimeout(() => { x.className = x.className.replace('show', ''); }, 3000);
    };

    game.sendInvite = function (data, player) {
      const url = $location.absUrl();
      const { username } = player.players[player.playerIndex];
      const msg = `hi ${data.name}, ${username} has invited to his game.
          click the link below to join - ${url}`;
      $http({
        method: 'POST',
        url: '/api/invite/users',
        data: { email: data.email, msg }
      }).then(
        (response) => {
          socket.emit('inviteSuccessful', { id: player.id });
        },
        (error) => {
          // socket.emit('searchError');
        }
      );
    };

    game.leaveGame = function () {
      game.players = [];
      game.time = 0;
      socket.emit('leaveGame');
    };

    game.pickCards = function (cards) {
      socket.emit('pickCards', { cards });
    };

    game.pickWinning = function (card) {
      socket.emit('pickWinning', { card: card.id });
    };

    decrementTime();

    return game;
  }
]);
