/* eslint-disable */
angular.module('mean.system').controller('IndexController', [
  '$scope',
  'Global',
  '$http',
  '$window',
  '$location',
  'socket',
  'game',
  'AvatarService',
  ($scope, Global, $http, $window, $location, socket, game, AvatarService) => {
    $scope.global = Global;

    $scope.playAsGuest = () => {
      game.joinGame();
      $location.path('/app');
    };
    $scope.name = "ello";


    $scope.showError = () => {
      return $location.search().error;
    };

    $scope.avatars = [];
    AvatarService.getAvatars().then((data) => {
      $scope.avatars = data;
    });

    $scope.login = () => {
      $http
        .post('/api/auth/login', {
          email: $scope.email,
          password: $scope.password
        })
        .then(
          (response) => {
            const {
              token
            } = response.data;
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
          (response) => {
            const {
              message
            } = response.data;
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
      const signup = (res) => {
        const userDetails = {
          name: $scope.name,
          email: $scope.email,
          password: $scope.password,
        };
        if (res) {
          userDetails.picture = res.secure_url;
          userDetails.publicId = res.public_id;
        }
        $http.post('/api/auth/signup', userDetails).then(
          (response) => {
            localStorage.setItem('token', response.data.token);
            // use the lower level api to change url and reload
            $window.location.href = '/';
          },
          (error) => {
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

  }
]);
const previewImage = () => {
  const myFile = $('#profilePic').prop('files')[0];
  const fReader = new FileReader();
  fReader.readAsDataURL(myFile);
  fReader.onload = (e) => {
    $('.profile-image').attr('src', e.target.result);
  };
};