const { signToken, verifyJWT } = require('./middlewares/authorization');
const questions = require('../app/controllers/questions');
const answers = require('../app/controllers/answers');
const avatars = require('../app/controllers/avatars');
const index = require('../app/controllers/index');
const users = require('../app/controllers/users');
const games = require('../app/controllers/games');

module.exports = (app, passport) => {
  // User Routes
  app.get('/signin', users.signin);
  app.get('/signup', users.signup);
  app.get('/chooseavatars', users.checkAvatar);
  app.get('/signout', users.signout);

  // Setting up the users api
  app.post('/users', users.create);
  app.post('/api/auth/signup', users.register);
  app.post('/users/avatars', users.avatars);
  app.get('/api/search/users', users.search);
  app.post('/api/invite/users', users.invite);

  // Donation Routes
  app.post('/donations', users.addDonation);
  app.get('/api/donations', verifyJWT, users.getDonation);

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.send({ message: 'Invalid user name or password' });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        const token = signToken(req.user.toJSON());
        res.send({ token, user: req.user });
      });
    })(req, res, next);
  });

  app.get('/users/me', users.me);
  app.get('/users/:userId', users.show);

  // Setting the facebook oauth routes
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['public_profile', 'email'],
    failureRedirect: '/signin'
  }), users.signin);

  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/signin'
  }), users.authCallback);

  // Setting the twitter oauth routes
  app.get(
    '/auth/twitter',
    passport.authenticate('twitter', {
      failureRedirect: '/signin'
    }),
    users.signin
  );

  app.get(
    '/auth/twitter/callback',
    passport.authenticate('twitter', {
      failureRedirect: '/signin'
    }),
    users.authCallback
  );

  // Setting the google oauth routes
  app.get(
    '/auth/google',
    passport.authenticate('google', {
      failureRedirect: '/signin',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
    }),
    users.signin
  );

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: '/signin'
    }),
    users.authCallback
  );

  // Finish with setting up the userId param
  app.param('userId', users.user);

  // Answer Routes
  app.get('/answers', answers.all);
  app.get('/answers/:answerId', answers.show);
  // Finish with setting up the answerId param
  app.param('answerId', answers.answer);

  // Question Routes
  app.get('/questions', questions.all);
  app.get('/questions/:questionId', questions.show);
  // Finish with setting up the questionId param
  app.param('questionId', questions.question);

  // Avatar Routes
  app.get('/avatars', avatars.allJSON);

  // Games history
  // app.get('/api/games/history', games.history);
  app.get('/api/games/history', verifyJWT, games.history);

  // Home route
  app.get('/play', index.play);
  app.get('/', index.render);

  app.post('/api/games/:id/start', index.start);
  app.get('/api/profile', verifyJWT, users.profile);

  // Leaderboard Route
  app.get('/api/leaderboard', verifyJWT, users.leaderboard);
};
