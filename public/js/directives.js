angular.module('mean.directives', [])
  .directive('listPlayerOnline', function() {
    return {
      restrict: 'EA',
      templateUrl: '/views/list-player-online.html',
      link: function(scope, elem, attr) {}
    };
  })
  .directive('chat', function(){
    return{
      restrict: 'EA',
      templateUrl: '/views/chat.html',
      link: function(scope, elem, attr){}
    };
  })
  .directive('region', function(){
    return{
      restrict: 'EA',
      templateUrl: '/views/modal.html',
      link: function(scope, elem, attr){}
    };
  })
  .directive('toast', function(){
    return{
      restrict: 'EA',
      templateUrl: '/views/toast.html',
      link: function(scope, elem, attr){}
    };
  })
  .directive('timer', function(){
    return{
      restrict: 'EA',
      templateUrl: '/views/timer.html',
      link: function(scope, elem, attr){}
    };
  })
  .directive('listCoPlayer', function(){
    return{
      restrict: 'EA',
      templateUrl: '/views/list-co-player.html',
      link: function(scope, elem, attr){}
    };
  })
  .directive('deck', function(){
    return{
      restrict: 'EA',
      templateUrl: '/views/deck.html',
      link: function(scope, elem, attr){}
    };
  })
  .directive('questionBoard', function(){
    return{
      restrict: 'EA',
      templateUrl: '/views/question-board.html',
      link: function(scope, elem, attr){
        scope.colors = ['#85a1bd', '#b394c5', '#93b4b9', '#b9a193', '#a16081', '#eedea0'];
        scope.$watch('game.state', function() {
          if (scope.game.state === 'winner has been chosen') {
            console.log('blobloo');
          var curQ = scope.game.curQuestion;
          var curQuestionArr = curQ.text.split('_');
          var startStyle = "<span style='color: "+scope.colors[scope.game.players[scope.game.winningCardPlayer].color]+"'>";
          var endStyle = "</span>";
          console.log('question>>>>>>>>>>>>>>> ', curQ);
          var shouldRemoveQuestionPunctuation = false;
          var removePunctuation = function(cardIndex) {
              var cardText = scope.game.table[scope.game.winningCard].card[cardIndex].text;
              if (cardText.indexOf('.',cardText.length-2) === cardText.length-1) {
              cardText = cardText.slice(0,cardText.length-1);
              } else if ((cardText.indexOf('!',cardText.length-2) === cardText.length-1 ||
              cardText.indexOf('?',cardText.length-2) === cardText.length-1) &&
              cardIndex === curQ.numAnswers-1) {
              shouldRemoveQuestionPunctuation = true;
              }
              return cardText;
          };
          if (curQuestionArr.length > 1) {
              var cardText = removePunctuation(0);
              curQuestionArr.splice(1,0,startStyle+cardText+endStyle);
              if (curQ.numAnswers === 2) {
              cardText = removePunctuation(1);
              curQuestionArr.splice(3,0,startStyle+cardText+endStyle);
              }
              curQ.text = curQuestionArr.join("");
              // Clean up the last punctuation mark in the question if there already is one in the answer
              if (shouldRemoveQuestionPunctuation) {
              if (curQ.text.indexOf('.',curQ.text.length-2) === curQ.text.length-1) {
                  curQ.text = curQ.text.slice(0,curQ.text.length-2);
              }
              }
          } else {
              curQ.text += ' '+startStyle+scope.game.table[scope.game.winningCard].card[0].text+endStyle;
          }
          }
        });
      }
    };
  });
