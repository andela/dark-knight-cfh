require('dotenv').config();

module.exports = {
  app: {
    name: 'Cards for Humanity - Development'
  },
  facebook: {
    callbackURL: process.env.FACEBOOK_CALLBACK
  },
  twitter: {
    callbackURL: process.env.TWITTER_CALLBACK
  },
  github: {
    callbackURL: process.env.GITHUB_CALLBACK
  },
  google: {
    callbackURL: process.env.GOOGLE_CALLBACK
  }
};
