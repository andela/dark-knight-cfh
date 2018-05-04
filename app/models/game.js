/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  config = require('../../config/config'),
  { Schema } = mongoose;


/**
 * Question Schema
 */
const GameSchema = new Schema({
  id: {
    type: Number
  },
  players: {
    type: Array,
  },
  winner: {
    type: String
  },
  gameId: {
    type: String
  },
  played: {
    type: Date,
    default: Date.now()
  }
});

/**
 * Statics
 */
GameSchema.statics = {
  load(id, cb) {
    this.findOne({
      id
    }).select('-_id').exec(cb);
  }
};

mongoose.model('Game', GameSchema);
