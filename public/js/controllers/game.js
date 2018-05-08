angular.module('mean.system') /* eslint-disable-line */
  .controller('GameController', ['$scope', 'game', '$timeout', '$location', 'MakeAWishFactsService', '$dialog',
    function ($scope, game, $timeout, $location, MakeAWishFactsService, $dialog) { /* eslint-disable-line */
      $scope.hasPickedCards = false;
      $scope.winningCardPicked = false;
      $scope.showTable = false;
      $scope.modalShown = false;
      $scope.search_input = '';
      $scope.game = game;
      $scope.startUserGame = false;
      $scope.level = '';
      $scope.owner = false;
      $scope.guest = false;
      $scope.pickedCards = [];
      // let makeAWishFacts = MakeAWishFactsService.getMakeAWishFacts();
      // $scope.makeAWishFact = makeAWishFacts.pop();
      $scope.name = 'ello bae';

      $scope.searchUser = function (playerInfo) {
        game.searchUser($scope.search_input, playerInfo);
      };

      $scope.pickCard = function (card) {
        if (!$scope.hasPickedCards) {
          if ($scope.pickedCards.indexOf(card.id) < 0) {
            $scope.pickedCards.push(card.id);
            if (game.curQuestion.numAnswers === 1) {
              $scope.sendPickedCards();
              $scope.hasPickedCards = true;
            } else if (game.curQuestion.numAnswers === 2 &&
              $scope.pickedCards.length === 2) {
              // delay and send
              $scope.hasPickedCards = true;
              $timeout($scope.sendPickedCards, 300);
            }
          } else {
            $scope.pickedCards.pop();
          }
        }
      };

      $scope.$watch('game.level', (newValue, oldValue) => { /* eslint-disable-line */
        if (newValue !== '') {
          localStorage.setItem('level', newValue); /* eslint-disable-line */
        }
      });

      $scope.pointerCursorStyle = function () {
        if ($scope.isCzar() && $scope.game.state === 'waiting for czar to decide') {
          return {
            cursor: 'pointer'
          };
        }
        return {};
      };

      $scope.$watch('game.state', (newValue, oldValue) => { /* eslint-disable-line */
        if (newValue === 'game ended' && game.playerIndex === 0) {
          const winner = game.players[game.gameWinner].id;
          const {
            players
          } = game;
          const newPlayers = players.map((player) => {
            const {
              id,
              points,
              username
            } = player;
            return {
              id,
              points,
              username
            };
          });
          const gameId = game.gameID;
          game.saveGame(winner, newPlayers, gameId);
        }
      });

      $scope.startSession = function () {
        $scope.startUserGame = true;
      };

      $scope.$watch('startUserGame', (newValue, oldValue) => { /* eslint-disable-line */
        if (newValue) {
          if ($location.search().game && !(/^\d+$/).test($location.search().game)) {
            game.joinGame('joinGame', $location.search().game);
          } else if ($location.search().custom) {
            game.joinGame('joinGame', null, true);
          } else {
            game.joinGame();
          }
        }
      });

      $scope.sendPickedCards = function () {
        game.pickCards($scope.pickedCards);
        $scope.showTable = true;
      };

      $scope.cardIsFirstSelected = function (card) {
        if (game.curQuestion.numAnswers > 1) {
          return card === $scope.pickedCards[0];
        }
        return false;
      };

      $scope.cardIsSecondSelected = function (card) {
        if (game.curQuestion.numAnswers > 1) {
          return card === $scope.pickedCards[1];
        }
        return false;
      };

      $scope.firstAnswer = function ($index) {
        if ($index % 2 === 0 && game.curQuestion.numAnswers > 1) {
          return true;
        }
        return false;
      };

      $scope.secondAnswer = function ($index) {
        if ($index % 2 === 1 && game.curQuestion.numAnswers > 1) {
          return true;
        }
        return false;
      };

      $scope.showFirst = function (card) {
        return game.curQuestion.numAnswers > 1 && $scope.pickedCards[0] === card.id;
      };

      $scope.showSecond = function (card) {
        return game.curQuestion.numAnswers > 1 && $scope.pickedCards[1] === card.id;
      };

      $scope.isCzar = function () {
        return game.czar === game.playerIndex;
      };

      $scope.isPlayer = function ($index) {
        return $index === game.playerIndex;
      };

      $scope.isCustomGame = function () {
        return !(/^\d+$/).test(game.gameID) && game.state === 'awaiting players';
      };

      $scope.isPremium = function ($index) {
        return game.players[$index].premium;
      };

      $scope.currentCzar = function ($index) {
        return $index === game.czar;
      };

      $scope.winningColor = function ($index) {
        if (game.winningCardPlayer !== -1 && $index === game.winningCard) {
          return $scope.colors[game.players[game.winningCardPlayer].color];
        }
        return '#f9f9f9';
      };

      $scope.pickWinning = function (winningSet) {
        if ($scope.isCzar()) {
          game.pickWinning(winningSet.card[0]);
          $scope.winningCardPicked = true;
        }
      };

      $scope.winnerPicked = function () {
        return game.winningCard !== -1;
      };

      $scope.startGame = function () {
        game.startGame();
      };

      $scope.abandonGame = function () {
        game.leaveGame();
        $location.path('/');
      };

      // Catches changes to round to update when no players pick card
      // (because game.state remains the same)
      $scope.$watch('game.round', () => {
        $scope.hasPickedCards = false;
        $scope.showTable = false;
        $scope.winningCardPicked = false;
        $scope.makeAWishFact = makeAWishFacts.pop();
        if (!makeAWishFacts.length) {
          makeAWishFacts = MakeAWishFactsService.getMakeAWishFacts();
        }
        $scope.pickedCards = [];
      });

      // In case player doesn't pick a card in time, show the table
      $scope.$watch('game.state', () => {
        if (game.state === 'waiting for czar to decide' && $scope.showTable === false) {
          $scope.showTable = true;
        }
      });

      $scope.$watch('game.gameID', () => {
        if (game.gameID && game.state === 'awaiting players') {
          if (!$scope.isCustomGame() && $location.search().game) {
            // If the player didn't successfully enter the request room,
            // reset the URL so they don't think they're in the requested room.
            $location.search({});
          } else if ($scope.isCustomGame() && !$location.search().game) {
            // Once the game ID is set, update the URL if this is a game with friends,
            // where the link is meant to be shared.
            $location.search({
              game: game.gameID
            });
            if (!$scope.modalShown) {
              setTimeout(() => {
                const link = document.URL; /* eslint-disable-line */
                const txt = 'Give the following link to your friends so they can join your game: ';
                $('#lobby-how-to-play').text(txt);
                $('#oh-el').css({
                  'text-align': 'center',
                  'font-size': '22px',
                  background: 'white',
                  color: 'black'
                }).text(link);
              }, 200);
              $scope.modalShown = true;
            }
          }
        }
      });
      console.log('***********>> ', $location.search().custom);

      if ($location.search().custom === true) {
        $scope.owner = true;
      } else if ($location.search().game !== undefined) {
        game.joinGame('joinGame', $location.search().game);
      } else if ($location.search().custom === undefined) {
        $scope.guest = true;
        $scope.owner = true;
      }
    }
  ]);
