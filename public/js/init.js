
// window.bootstrap = function() {
//     angular.bootstrap(document, ['mean']);
// };

// window.init = function() {
//     window.bootstrap();
// };
// if (window.location.hash == '#_=_') window.location.hash = '#!';
if (window.location.hash === '#') window.location.hash = '#!';
if (window.location.href.endsWith('#')) {
  window.location.href = window.location.href.slice(0, -1);
}

const getQuerystring = (key) => {
  const query = window.location.search.substring(1);
  const vars = query.split('&');
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    if (pair[0] === key) {
      return pair[1];
    }
  }
};
if (getQuerystring('token')) {
  window.location.assign('/');
}
window.user = jwt_decode(localStorage.getItem('token'));

// console.log(window.location);
// window.location.href = window.location.origin;
// $(document).ready(function() {
//     //Fixing facebook bug with redirect

//     //Then init the app
//     window.init();
// });
