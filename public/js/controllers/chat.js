/**
 * Represents a scroll Messages
 * @constructor
 * @param { object } chats messages
 * @returns {object} animate output
 */
function scrollMessage() {
  const newChat = $('#chatInterface');
  setTimeout(() => {
    newChat.animate({
      scrollTop: newChat[0].scrollHeight
    }, 200);
  });
}

angular.module('mean.system')
  .controller('ChatController', ['$scope', '$firebaseArray', 'game', function ($scope, $firebaseArray, game) {
    let refToFirebase;
    const firstTime = true;
    const openChatBox = false;
    let oldMessageLength = 0,
      newMessageLength = 0;
    $scope.checkUnreadMsg = false;
    $scope.chatArray = [];

    // send a chat method
    $scope.addNewChat = function () {
      if (game.newChat) {
        $scope.addNewMessage = {
          user: game.players[game.playerIndex].username,
          addNewMessage: game.newChat,
          timeStamp: new Date().toISOString()
        };
        $scope.chatArray.$add($scope.addNewMessage);
        scrollMessage();
        game.newChat = '';
      }
    };

    // send a chat using enter keypress
    $scope.sendChatToDb = function (event) {
      if (event) {
        const keyCode = event.which || event.keyCode;
        if (keyCode === 13 && game.newChat) {
          $scope.displayMsg = game.newChat;
          $scope.addNewChat();
          game.newChat = '';
          $('#chatMessages').val(' ');
          scrollMessage();
        }
      }
    };

    $(document).ready(() => {
      const emoji = $('#chatBox').emojioneArea({
        pickerPosition: 'top',
        recentEmojis: true,
        emojiPlaceholder: ':smile:',
        events: {
          keyup: (editor, event) => {
            const keyCode = event.which;
            if (keyCode === 13) {
              game.newChat = emoji.data('emojioneArea').getText();
              emoji.data('emojioneArea').setText('');
              $scope.sendChatToDb(event);
            } else {
              game.newChat = emoji.data('emojioneArea').getText();
              scrollMessage();
            }
          }
        }
      });
    });

    $scope.$watch('game.gameID', (newValue, oldValue) => {/* eslint-disable-line */
      if (newValue) {
        refToFirebase = new Firebase(`https://chatapp-3aaa8.firebaseio.com/game${game.gameID}`);
        //   console.log(`https://chatapp-3aaa8.firebaseio.com/game${game.gameID}`);
        $scope.chatArray = $firebaseArray(refToFirebase);

        if (firstTime) {
          refToFirebase.remove();
        //   console.log('null values');
        }
      }
    });

    $scope.showTime = function (timeStamp) {
      return moment(timeStamp).format('hh:mm A');
    };


    $scope.collapseChat = function () {
      if ($scope.openChatBox) {
        $scope.openChatBox = false;
        oldMessageLength = newMessageLength;
        $scope.unreadMessage = null;
        $scope.checkUnreadMsg = false;
      } else {
        $scope.openChatBox = true;
        // $scope.checkUnreadMsg = true;
      }
    };

    $scope.$watch('chatArray', (oldValue, newValue) => {
      // read the length of chat array when new message is sent
      newMessageLength = $scope.chatArray.length;
      $scope.unreadMessage = newMessageLength - oldMessageLength;
      if ($scope.unreadMessage === 0) {
        $scope.unreadMessage = null;
      } else {
        $scope.checkUnreadMsg = true;
      }
    }, true);
  }]);

