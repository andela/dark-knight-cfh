/**
* @description creates a new player object
*
* @param {object} socket a review object
* @return {object} return an array of objects
*/
function Player(socket) {
  this.socket = socket;
  this.hand = [];
  this.points = 0;
  this.username = null;
  this.premium = 0;
  this.avatar = null;
  this.userID = null;
  this.color = null;
}

module.exports = Player;
