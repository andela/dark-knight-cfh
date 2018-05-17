/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  async = require('async'),
  Question = mongoose.model('Question'),
  _ = require('underscore');


/**
*
* @param {object} req a review object
* @param {object} res a review object
* @param {function} next a review object
* @param {string} id a review object
* @return {object} return an array of objects
*/
exports.question = function (req, res, next, id) {
  Question.load(id, (err, question) => {
    if (err) return next(err);
    if (!question) return next(new Error(`Failed to load question ${id}`));
    req.question = question;
    next();
  });
};


/**
*
* @param {object} req a review object
* @param {object} res a review object
* @return {object} return an array of objects
*/
exports.show = function (req, res) {
  res.jsonp(req.question);
};


/**
*
* @param {object} req a review object
* @param {object} res a review object
* @return {object} return an array of objects
*/
exports.all = function (req, res) {
  Question.find({ official: true, numAnswers: { $lt: 3 } }).select('-_id').exec((err, questions) => {
    if (err) {
      res.render('error', {
        status: 500
      });
    } else {
      res.jsonp(questions);
    }
  });
};


/**
*
* @param {function} cb a review object
* @return {object} return an array of objects
*/
exports.allQuestionsForGame = function (regionId, cb) {
  const regId = regionId.toString();
  Question.find({ official: true, $and: [{ numAnswers: { $lt: 3 } }, { regionId: regId }] }).select('-_id').exec((err, questions) => {
    if (err) {
      console.log(err);
    } else {
      cb(questions);
    }
  });
};

