const mongoose = require('mongoose'),
  LocalStrategy = require('passport-local').Strategy,
  TwitterStrategy = require('passport-twitter').Strategy,
  FacebookStrategy = require('passport-facebook').Strategy,
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  User = mongoose.model('User'),
  config = require('./config');

require('dotenv').config();
/**
 * @param {any} passport
 * @returns {undefined} null
 */
module.exports = (passport) => {
  // Serialize sessions
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    User.findOne(
      {
        _id: id
      },
      (err, user) => {
        user.email = null;
        user.facebook = null;
        user.hashed_password = null;
        done(err, user);
      }
    );
  });

  // Use local strategy
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    (email, password, done) => {
      User.findOne(
        {
          email
        },
        (err, user) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            return done(null, false, {
              message: 'Unknown user'
            });
          }
          if (!user.authenticate(password)) {
            return done(null, false, {
              message: 'Invalid password'
            });
          }
          user.email = null;
          user.hashed_password = null;
          return done(null, user);
        }
      );
    }
  ));
  // Use twitter strategy
  passport.use(new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: config.twitter.callbackURL
    },
    (token, tokenSecret, profile, done) => {
      User.findOne(
        {
          'twitter.id_str': profile.id
        },
        (err, user) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            user = new User({
              name: profile.displayName,
              username: profile.username,
              provider: 'twitter',
              twitter: profile._json,
              avatar: profile._json.profile_image_url
            });
            user.save((err) => {
              if (err) console.log(err);
              return done(err, user);
            });
          } else {
            return done(err, user);
          }
        }
      );
    }
  ));

  // Use facebook strategy
  passport.use(new FacebookStrategy(
    {
      clientID: process.env.FB_CLIENT_ID,
      clientSecret: process.env.FB_CLIENT_SECRET,
      callbackURL: config.facebook.callbackURL,
      profileFields: ['id', 'birthday', 'email', 'first_name', 'last_name', 'gender', 'picture.width(200).height(200)']
    },
    (accessToken, refreshToken, profile, done) => {
      console.log(profile);
      User.findOne(
        {
          'facebook.id': profile.id
        },
        (err, user) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            user = new User({
              name: profile.displayName,
              email: (profile.emails && profile.emails[0].value) || '',
              username: profile.username,
              provider: 'facebook',
              facebook: profile._json,
              avatar: profile.photos[0].value || profile._json.picture || profile._json.avatar || profile.json.picture.data.url || profile.json.avatar.data.url
            });
            user.save((err) => {
              if (err) console.log(err);
              user.facebook = null;
              return done(err, user);
            });
          } else {
            user.facebook = null;
            return done(err, user);
          }
        }
      );
    }
  ));
  // Use google strategy
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: config.google.callbackURL
    },
    (accessToken, refreshToken, profile, done) => {
      User.findOne(
        {
          'google.id': profile.id
        },
        (err, user) => {
          if (err) {
            return done(err);
          }
          if (!user) {
            user = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              username: profile.username,
              provider: 'google',
              google: profile._json,
              avatar: profile._json.picture || profile._json.avatar
            });
            user.save((err) => {
              if (err) console.log(err);
              return done(err, user);
            });
          } else {
            return done(err, user);
          }
        }
      );
    }
  ));
};
