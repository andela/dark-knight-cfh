/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  async = require('async'),
  _ = require('underscore');

exports.play = function (req, res) {
  if (Object.keys(req.query)[0] === 'custom') {
    res.redirect('/#!/app?custom');
  } else {
    res.redirect('/#!/app');
  }
};

exports.render = (req, res) => {
  res.render('index', {
    user: req.user ? JSON.stringify(req.user) : 'null'
  });
};
