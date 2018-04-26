angular.module('mean.system')
  .controller('IndexController', 
  ['$scope', 'Global', '$http','$location', 'socket', 
  'game', 'AvatarService', 
  function ($scope, Global, $http, $location, socket, game, AvatarService) {
    $scope.global = Global;

    $scope.playAsGuest = function () {
      game.joinGame();
      $location.path('/app');
    };

    $scope.showError = function () {
      if ($location.search().error) {
        return $location.search().error;
      } else {
        return false;
      }
    };

    $scope.avatars = [];
    AvatarService.getAvatars()
      .then(function (data) {
        $scope.avatars = data;
      });

    $scope.login = function () {
      $http.post('/api/auth/login', {
        email: $scope.email,
        password: $scope.password
      }).then(function successCallback(response) {
        const token = response.data.token;
        if(token){
          window.user = response.data.user;
          $scope.global.authenticated = true;
          localStorage.setItem('token', token);
          $location.path('/');
        }
        else{
$location.search('error', 'invalid');
        }
      }, function errorCallback(response) {
        $location.search('error', 'invalid');

      });
    };

    $scope.logout =  function(){
      window.user = null;
      $scope.global.authenticated = false;
      localStorage.removeItem('token');
    };
  }]);