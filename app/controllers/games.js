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
  const pageNum = parseInt(req.query.pageNum, 10) || 0;
  const numOfItems = parseInt(req.query.numOfItems, 10) || 15;

  // get the total number of rows in the collection then find
  // Game.count({ id: userID })
  // Game.where({ id: userID }).count()
  const query = {
    players: {
      $elemMatch: {
        id: userID
      }
    }
  };
  Game.count(query)
    .then((count) => {
      const numOfPages = Math.ceil(count / numOfItems);
      Game.find(query)
        .skip(pageNum * numOfItems)
        .limit(numOfItems)
        .exec()
        .then((game) => {
          if (game) {
            return res.status(200).json({
              game,
              count,
              numOfPages,
              pageNum,
              message: 'Games returned!'
            });
          }
          return res.status(400).json({
            message: 'No game found!'
          });
        })
        .catch(error => res.status(500).json(error.message || 'Unable to query the database'));
    })
    .catch(error =>
      res.status(500).json({
        message: error.message || 'Unable to query the database'
      }));
};
