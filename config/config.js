const _ = require('underscore');
// Load app configuration
module.exports = _.extend(
  require('./env/all.js'),
  require(`./env/${process.env.NODE_ENV}`) || {}
);
