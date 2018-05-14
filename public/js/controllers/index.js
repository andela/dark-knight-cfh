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

    if (localStorage.getItem('token')) {
      $scope.pic = jwt_decode(localStorage.getItem('token')).avatar;
    }

    $scope.games = [];
    $scope.userPoints = 0;
    $scope.leaderboardInfo = [];

    $scope.profile = () => {
      const token = localStorage.getItem('token');

      $scope.profileData = $http.get('/api/profile', {
        headers: {
          'x-access-token': token
        }
      });

      /**
       * @description fetches leaderboard data
       *
       * @param { number } page page num
       * @param { number } limit num of recors to be fetched
       *
       * @returns { array } an array of users
       */
      const fetchLeaderboardData = (page, limit) => {
        return $http.get(`/api/leaderboard?page=${page}&limit=${limit}`, {
          headers: { 'x-access-token': token }
        });
      };

      /**
       * @description fetches game log data
       *
       * @param { number } pageNum page num
       * @param { number } numOfItems no of recors to be fetched
       *
       * @returns { array } an array of games
       */
      const fetchGameLogData = (pageNum, numOfItems) => {
        return $http.get(`/api/games/history=${pageNum}&limit=${numOfItems}`, {
          headers: { 'x-access-token': token }
        });
      };

      $scope.historyData = $http.get('/api/games/history', {
        headers: {
          'x-access-token': token
        }
      });

      $scope.page = 0;
      $scope.pageNum = 0;

      $scope.disablePrevButton = true;
      $scope.disablePrevButtonGameLog = true;
      if ($scope.page === 0) $scope.disablePrevButton = true;
      if ($scope.pageNum === 0) $scope.disablePrevButtonGameLog = true;
      // if ($scope.pageNum === 0) $scope.disableNextButtonGameLog = true;

      if ($scope.pageNum + 1 >= $scope.maxPages) $scope.disableNextButtonGameLog = true;

      $scope.fetchPrevPageGameLog = () => {
        const count = 15;
        $scope.pageNum -= 1;

        if ($scope.pageNum === 0) $scope.disablePrevButton = true;

        if ($scope.pageNum + 1 >= $scope.maxPages) {
          $scope.disableNextButton = true;
        } else {
          $scope.disableNextButton = false;
        }

        // fetches game log when the button is clicked
        fetchGameLogData($scope.pageNum, numOfItems).then(response => {
          console.log(response.data, '***********response.data');
          $scope.maxPages = response.data.numOfPages;
        });

        // disbales next button if the current page number is the max page number
        console.log($scope.pageNum, $scope.maxPages);
        if ($scope.pageNum >= $scope.maxPages) $scope.disableNextButtonGameLog = false;
      };

      $scope.fetchNextPageGameLog = () => {
        // set page number and number of items to fetch
        const numOfItems = 15;
        $scope.pageNum += 1;

        if ($scope.pageNum === 0) $scope.disablePrevButtonGameLog = true;
        if ($scope.pageNum + 1 >= $scope.numOfPages) $scope.disableNextButtonGameLog = true;

        fetchGameLogData($scope.pageNum, numOfItems).then(response => {
          // console.log(response.data, '***********response.data');
          $scope.game = response.data.game;
          $scope.maxPages = response.data.count / responsedata.numOfPages;
          // $scope.count = response.data.count;
        });
        console.log($scope.pageNum + 1, $scope.maxPages);
        if ($scope.pageNum + 1 >= $scope.numOfPages) $scope.disableNextButtonGameLog = true;
        // .catch(err => console.log(err));
      };

      /**
       * fetches data for next page for the leaderboard
       */
      $scope.fetchNextPageLeaderboard = () => {
        const limit = 15;
        $scope.page += 1;
        if ($scope.page === 0) $scope.disablePrevButton = true;
        if ($scope.page + 1 >= $scope.numOfPages) $scope.disableNextButton = true;
        // console.log(`/api/leaderboard?page=${$scope.page}&limit=${limit}`);
        $scope.leaderboardData = fetchLeaderboardData($scope.page, limit).then(response => {
          $scope.leaderboardInfo = response.data.secureUsers;
          $scope.count = response.data.count;
          $scope.numOfPages = response.data.numOfPages;
          $scope.disablePrevButton = false;
          // $scope.leaderboardInfo.
        });
      };

      /**
       * fetches previous page for leaderboard table
       */
      $scope.fetchPrevPageLeaderboard = () => {
        const limit = 15;
        $scope.page -= 1;

        if ($scope.page === 0) $scope.disablePrevButton = true;

        if ($scope.page + 1 >= $scope.numOfPages) {
          $scope.disableNextButton = true;
        } else {
          $scope.disableNextButton = false;
        }

        $scope.leaderboardData = fetchLeaderboardData($scope.page, limit).then(response => {
          $scope.leaderboardInfo = response.data.secureUsers;
        });
      };

      $scope.leaderboardData = fetchLeaderboardData(0, 15);

      $q.all([$scope.profileData, $scope.historyData, $scope.leaderboardData]).then(response => {
        if (response) {
          const userData = response[0].data.user;
          const gameData = response[1].data.game;
          const leaderboardInfo = response[2].data.secureUsers;
          $scope.leaderboardInfo = leaderboardInfo;
          $scope.imageUrl = userData.avatar;
          $scope.email = userData.email || userData.phone || null;
          $scope.name = userData.name || userData.username || null;
          $scope.userPoints = userData.points;
          $scope.userId = userData._id;
          // $scope.page = 1
          $scope.count = response[2].data.count;
          $scope.numOfPages = response[2].data.numOfPages;

          $scope.maxPages = response[1].data.numOfPages;

          if ($scope.page + 1 >= $scope.numOfPages) {
            $scope.disableNextButton = true;
          }

          if ($scope.pageNum + 1 >= $scope.maxPages) {
            $scope.disableNextButtonGameLog = true;
          }

          $scope.games = gameData;

          $scope.userRank = '';
          const x = $scope.userPoints;

          if (x < 10) {
            $scope.userRank = 'Pawn';
          } else if (x < 20) {
            $scope.userRank = 'Knight';
          } else if (x < 50) {
            $scope.userRank = 'Bishop';
          } else if (x < 100) {
            $scope.userRank = 'Rook';
          } else if (x < 150) {
            $scope.userRank = 'Queen';
          } else if (x < 250) {
            $scope.userRank = 'King';
          }
        }
      });

      // console.log($scope.leaderboardInfo);

      $scope.highlightPlayerClass = id => {
        if ($scope.userId === id) return 'ClassA';
        return 'ClassB';
      };

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
