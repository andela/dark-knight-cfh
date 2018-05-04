/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  Game = mongoose.model('Game');

/**
   * Get all game history
   * @param {object} req
   * @param {object} res
   * @return {object} history object
   */
exports.history = function (req, res) {
  const userID = req.verified._id;
  Game.find({
    players: {
      $elemMatch: {
        id: userID
      }
    }
  })
    .exec()
    .then((game) => {
      if (game) {
        return res.status(200).json({
          game,
          message: 'Games returned!'
        });
      }
      return res.status(400).json({
        message: 'No game found!'
      });
    })
    .catch(error =>
      res.status(500).json(error.message || 'Unable to query the database'));
};
