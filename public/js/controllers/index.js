/* eslint-disable */
angular.module('mean.system').controller('IndexController', [
  '$scope',
  'Global',
  '$http',
  '$window',
  '$location',
  '$q',
  'socket',
  'game',
  'AvatarService',
  ($scope, Global, $http, $window, $location, $q, socket, game, AvatarService) => {
    $scope.global = Global;

    $scope.playAsGuest = () => {
      game.joinGame();
      $location.path('/app');
    };

    $scope.showError = () => {
      return $location.search().error;
    };

    $scope.avatars = [];
    AvatarService.getAvatars().then(data => {
      $scope.avatars = data;
    });

    $scope.login = () => {
      $http
        .post('/api/auth/login', {
          email: $scope.email,
          password: $scope.password
        })
        .then(
          response => {
            const { token } = response.data;
            if (token) {
              window.user = response.data.user;
              $scope.global.authenticated = true;
              $scope.global.user = window.user;
              localStorage.setItem('token', token);
              $location.path('/');
            } else {
              $location.search('error', 'invalid');
            }
          },
          response => {
            const { message } = response.data;
            $location.search('error-message', message);
            $location.search('error', 'invalid');
          }
        );
    };

    $scope.logout = () => {
      window.user = null;
      $scope.global.authenticated = false;
      localStorage.removeItem('token');
      $window.location.assign('/');
    };

    $scope.register = () => {
      const myFile = $('#profilePic').prop('files')[0];
      const signup = res => {
        const userDetails = {
          name: $scope.name,
          email: $scope.email,
          password: $scope.password
        };
        if (res) {
          userDetails.avatar = res.secure_url;
          userDetails.publicId = res.public_id;
        }
        $http.post('/api/auth/signup', userDetails).then(
          response => {
            const { token } = response.data;
            if (token) {
              console.log(token);
              window.user = response.data.newUser;
              $scope.global.authenticated = true;
              $scope.global.user = window.user;
              localStorage.setItem('token', token);
              $location.path('/');
            } else {
              $location.search('error', 'invalid');
            }
            // localStorage.setItem('token', response.data.token);
            // // use the lower level api to change url and reload
            // $window.location.href = '/';
          },
          error => {
            $scope.global.error = error.data.message || error.data;
          }
        );
      };
      if (myFile) {
        const imageData = new FormData();
        const publicId = `${Date.now()}-${myFile.name}`;
        const folder = 'cfh/dev/profileImage';
        imageData.append('file', myFile);
        imageData.append('tags', 'profileImage');
        imageData.append('upload_preset', 'm4vlbdts');
        imageData.append('api_key', '789891965151338');
        imageData.append('timestamp', (Date.now() / 1000) | 0);
        imageData.append('folder', folder);
        imageData.append('public_id', publicId);
        $.ajax({
          url: 'https://api.cloudinary.com/v1_1/eventmanager/image/upload',
          data: imageData,
          cache: false,
          contentType: false,
          processData: false,
          method: 'POST',
          success(res) {
            signup(res);
          }
        });
      } else {
        signup();
      }
    };
    $scope.namez = 'jane';

    $scope.games = [];
    $scope.userPoints = 0;
    $scope.profile = () => {
      const token = localStorage.getItem('token');
      // const userData = jwt_decode(token);

      $scope.profileData = $http.get('/api/profile', {
        headers: {
          'x-access-token': token
        }
      });

      // if (token) {
      //   $scope.imageUrl = userData.avatar;
      //   $scope.email = userData.email || userData.phone || null;
      //   $scope.name = userData.name || userData.username || null;
      // }

      $scope.historyData = $http.get('/api/games/history', {
        headers: {
          'x-access-token': token
        }
      });
      $q.all([$scope.profileData, $scope.historyData]).then(response => {
        if (response) {
          const userData = response[0].data.user;
          const gameData = response[1].data.game;
          console.log('>>>>>>>>>>>>>', userData);
          console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
          console.log('>>>>>>>>>>>>>', gameData);
          $scope.imageUrl = userData.avatar;
          $scope.email = userData.email || userData.phone || null;
          $scope.name = userData.name || userData.username || null;
          $scope.userPoints = userData.points;

          $scope.games = gameData;

          $scope.userRank = '';
          const x = $scope.userPoints;

          if (x < 20) {
            $scope.userRank = 'Pawn';
          } else if (x < 20) {
            $scope.userRank = 'Knight';
          } else if (x < 50) {
            $scope.userRank = 'Bishop';
          } else if (x < 100) {
            $scope.userRank = 'Rook';
          } else if (x < 200) {
            $scope.userRank = 'Queen';
          } else if (x < 250) {
            $scope.userRank = 'King';
          }
        }
      });
    };
  }
]);
const previewImage = () => {
  const myFile = $('#profilePic').prop('files')[0];
  const fReader = new FileReader();
  fReader.readAsDataURL(myFile);
  fReader.onload = e => {
    $('.profile-image').attr('src', e.target.result);
  };
};
