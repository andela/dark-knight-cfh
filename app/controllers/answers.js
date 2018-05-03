/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  async = require('async'),
  Answer = mongoose.model('Answer'),
  _ = require('underscore');


exports.answer = function (req, res, next, id) {
  Answer.load(id, (err, answer) => {
    if (err) return next(err);
    if (!answer) return next(new Error(`Failed to load answer ${id}`));
    req.answer = answer;
    next();
  });
};

exports.show = function (req, res) {
  res.jsonp(req.answer);
};

exports.all = function (req, res) {
  Answer.find({ official: true }).select('-_id').exec((err, answers) => {
    if (err) {
      res.render('error', {
        status: 500
      });
    } else {
      res.jsonp(answers);
    }
  });
};

exports.allAnswersForGame = function (cb) {
  Answer.find({ official: true }).select('-_id').exec((err, answers) => {
    if (err) {
      console.log(err);
    } else {
      cb(answers);
    }
  });
};
