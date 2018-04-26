var mongoose = require("mongoose"),
  LocalStrategy = require("passport-local").Strategy,
  TwitterStrategy = require("passport-twitter").Strategy,
  FacebookStrategy = require("passport-facebook").Strategy,
  GitHubStrategy = require("passport-github").Strategy,
  GoogleStrategy = require("passport-google-oauth").OAuth2Strategy,
  User = mongoose.model("User"),
  config = require("./config");

module.exports = function(passport) {
  //Serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findOne(
      {
        _id: id
      },
      function(err, user) {
        user.email = null;
        user.facebook = null;
        user.hashed_password = null;
        done(err, user);
      }
    );
  });

  //Use local strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password"
      },
      function(email, password, done) {
        User.findOne(
          {
            email: email
          },
          function(err, user) {
            if (err) {
              return done(err);
            }
            if (!user) {
              return done(null, false, {
                message: "Unknown user"
              });
            }
            if (!user.authenticate(password)) {
              return done(null, false, {
                message: "Invalid password"
              });
            }
            user.email = null;
            user.hashed_password = null;
            return done(null, user);
          }
        );
      }
    )
  );

  //Use twitter strategy
  passport.use(
    new TwitterStrategy(
      {
        consumerKey:
          process.env.TWITTER_CONSUMER_KEY || "OSScRM0a3Ba6xoWbClmCnuXoL", // config.twitter.clientID,
        consumerSecret:
          process.env.TWITTER_CONSUMER_SECRET ||
          "smiAUwUniIMXp4wheyqp3EPABGLk6M9kui5DsgM0s17AJwGEbF", // config.twitter.clientSecret,
        callbackURL: "http://localhost:3000/auth/twitter/callback" // config.twitter.callbackURL
      },
      function(token, tokenSecret, profile, done) {
        User.findOne(
          {
            "twitter.id_str": profile.id
          },
          function(err, user) {
            if (err) {
              return done(err);
            }
            if (!user) {
              user = new User({
                name: profile.displayName,
                username: profile.username,
                provider: "twitter",
                twitter: profile._json,
                picture: profile._json.profile_image_url
              });
              user.save(function(err) {
                if (err) console.log(err);
                return done(err, user);
              });
            } else {
              return done(err, user);
            }
          }
        );
      }
    )
  );

  //Use facebook strategy
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FB_CLIENT_ID || "648304275501258", // config.facebook.clientID,
        clientSecret:
          process.env.FB_CLIENT_SECRET || "f53ebfaaacfde2934d3157e383aca66c", // config.facebook.clientSecret,
        callbackURL: "http://localhost:3000/auth/facebook/callback" // config.facebook.callbackURL
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOne(
          {
            "facebook.id": profile.id
          },
          function(err, user) {
            if (err) {
              return done(err);
            }
            if (!user) {
              console.log(profile);
              user = new User({
                name: profile.displayName,
                email: (profile.emails && profile.emails[0].value) || "",
                username: profile.username,
                provider: "facebook",
                facebook: profile._json,
                picture: profile._json.picture || profile.json.picture.data.url
              });
              user.save(function(err) {
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
    )
  );

  //Use github strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: "fe9ac1cce36721989f61", // process.env.GITHUB_CLIENT_ID || config.github.clientID,
        clientSecret: "d551703c35b5021da36bd23d646e957a0048afbc", // process.env.GITHUB_CLIENT_SECRET || config.github.clientSecret,
        callbackURL: "http://localhost:3000/auth/github/callback" // config.github.callbackURL
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOne(
          {
            "github.id": profile.id
          },
          function(err, user) {
            if (err) {
              return done(err);
            }
            if (!user) {
              user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                username: profile.username,
                provider: "github",
                github: profile._json,
                picture: profile._json.avatar_url
              });
              user.save(function(err) {
                if (err) console.log(err);
                return done(err, user);
              });
            } else {
              return done(err, user);
            }
          }
        );
      }
    )
  );

  //Use google strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: "864087924513-19pecdvmgrga2shb86hs3so1kll59g5l.apps.googleusercontent.com", // process.env.GOOGLE_CLIENT_ID || config.google.clientID,
        clientSecret: "nJ26R6NqVCGFSKEwjV8RHfHV",
        // process.env.GOOGLE_CLIENT_SECRET || config.google.clientSecret,
        callbackURL: "http://localhost:3000/auth/google/callback" // config.google.callbackURL
      },
      function(accessToken, refreshToken, profile, done) {
        User.findOne(
          {
            "google.id": profile.id
          },
          function(err, user) {
            if (err) {
              return done(err);
            }
            if (!user) {
              user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                username: profile.username,
                provider: "google",
                google: profile._json,
                picture: profile._json.picture,
              });
              user.save(function(err) {
                if (err) console.log(err);
                return done(err, user);
              });
            } else {
              return done(err, user);
            }
          }
        );
      }
    )
  );
};
