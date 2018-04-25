const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

exports.generateToken = payload => {
  const token = jwt.sign(payload, process.env.SECRET, {
    expiresIn: '24h' // expires in 24hrs
  });
  return token;
};
