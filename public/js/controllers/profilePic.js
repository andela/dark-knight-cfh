function previewImage() {
  const myFile = $('#profilePic').prop('files')[0];
  const fReader = new FileReader();
  fReader.readAsDataURL(myFile);
  fReader.onload = function (e) {
    $('.profile-image').attr('src', e.target.result);
  };
}
angular.module('mean.system').controller('signupController', ($scope) => {
  // action="/users"
  $scope.signup = function () {
    const myFile = $('#profilePic').prop('files')[0];
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
      /**
     *
     *
     * @param {any} res
     */
      function signup(res) {
        const userDetails = new FormData();
        userDetails.append('name', $scope.name);
        userDetails.append('email', $scope.email);
        userDetails.append('password', $scope.password);
        if (res) {
          userDetails.append('picture', res.secure_url);
          userDetails.append('publicId', res.public_id);
        }
        $.ajax({
          url: '/users',
          data: userDetails,
          contentType: false,
          processData: false,
          method: 'POST',
          success(res) {
            location.href = '/#!/';
            location.reload();
          }
        });
      }
    }
  };
});

