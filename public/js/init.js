
// window.bootstrap = function() {
//     angular.bootstrap(document, ['mean']);
// };

// window.init = function() {
//     window.bootstrap();
// };
if (window.location.hash == '#_=_') window.location.hash = '#!';

window.user = jwt_decode(localStorage.getItem('token'));

// $(document).ready(function() {
//     //Fixing facebook bug with redirect


//     //Then init the app
//     window.init();
// });
