/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  async = require('async'),
  _ = require('underscore');

const Game = mongoose.model('Game');
const User = mongoose.model('User');

/**
* @description creates a new game object
*
* @param {object} req a review object
* @param {object} res a review object
* @return {object} return an array of objects
*/
exports.play = function (req, res) {
  if (Object.keys(req.query)[0] === 'custom') {
    res.redirect('/#!/app?custom');
  } else {
    res.redirect('/#!/app');
  }
};

exports.render = function (req, res) {
  res.render('index', {
    user: req.user ? JSON.stringify(req.user) : 'null'
  });
};

exports.start = function (req, res) {
  let points;
  const { players, winner, level } = req.body;
  if (level === 'beginner') {
    points = 1;
  } else if (level === 'intermidiate') {
    points = 3;
  } else if (level === 'legend') {
    points = 5;
  }
  User.findOneAndUpdate(
    { name: winner },
    { $inc: { points } }, { new: true }, (err, doc) => {
      if (!doc) {
        return res.status(500).send({
          status: 'Unsuccessful',
          err
        });
      }
      const game = new Game({
        gameId: req.params.id,
        winner,
        players
      });
      game.save((err, games) => {
        if (err) {
          return res.status(500).send({
            status: 'Unsuccessful',
            err
          });
        }
        return res.status(201).send({
          status: 'successful',
          games,
          doc
        });
      });
    }
  );
};
