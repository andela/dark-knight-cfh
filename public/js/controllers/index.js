angular.module('mean.system').controller('IndexController', [
  '$scope',
  '$http',
  '$window',
  'Global',
  '$location',
  'socket',
  'game',
  'AvatarService',
  function($scope, $http, $window, Global, $location, socket, game, AvatarService) {
    $scope.global = Global;

    $scope.playAsGuest = function() {
      game.joinGame();
      $location.path('/app');
    };

    $scope.showError = function() {
      if ($location.search().error) {
        return $location.search().error;
      } else {
        return false;
      }
    };

    $scope.avatars = [];
    AvatarService.getAvatars().then(function(data) {
      $scope.avatars = data;
    });

    $scope.register = () => {
      const user = {
        name: $scope.name,
        email: $scope.email,
        password: $scope.password
      };
      $http.post('/api/auth/signup', user).then(
        response => {
          localStorage.setItem('token', response.data.token);
          // use the lower level api to change url and reload
          $window.location.href = '/';
        },
        error => {
          $scope.global.error = error.data.message || error.data;
        }
      );
    };
  }
]);
