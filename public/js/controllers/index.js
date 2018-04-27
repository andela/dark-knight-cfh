angular.module('mean.system')
  .controller(
    'IndexController',
    ['$scope', 'Global', '$http', '$location', 'socket',
      'game', 'AvatarService',
      ($scope, Global, $http, $location, socket, game, AvatarService) => {
        $scope.global = Global;

        $scope.playAsGuest = () => {
          game.joinGame();
          $location.path('/app');
        };

        $scope.showError = () => {
          if ($location.search().error) {
            return $location.search().error;
          }
          return false;
        };

        $scope.avatars = [];
        AvatarService.getAvatars()
          .then((data) => {
            $scope.avatars = data;
          });

        $scope.login = () => {
          $http.post('/api/auth/login', {
            email: $scope.email,
            password: $scope.password
          }).then((response) => {
            const { token } = response.data;
            if (token) {
              window.user = response.data.user;
              $scope.global.authenticated = true;
              localStorage.setItem('token', token);
              $location.path('/');
            } else {
              $location.search('error', 'invalid');
            }
          }, (response) => {
            const { message } = response.data;
            $location.search('error-message', message);
            $location.search('error', 'invalid');
          });
        };

        $scope.logout = () => {
          window.user = null;
          $scope.global.authenticated = false;
          localStorage.removeItem('token');
        };
      }]
  );
