const jwt = require('jsonwebtoken');

/**
 * Generic require login routing middleware
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   * @returns {function} callback
 */
exports.requiresLogin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.send(401, 'User is not authorized');
  }
  next();
};

/**
 * User authorizations routing middleware
 */
exports.user = {
  hasAuthorization(req, res, next) {
    if (req.profile.id !== req.user.id) {
      return res.send(401, 'User is not authorized');
    }
    next();
  }
};

/**
 * JWT verification middleware
   * @param {object} req
   * @param {object} res
   * @param {callback} next
   * @returns {function} callback
 */
exports.verifyJWT = (req, res, next) => {
  const token = req.query.token ||
                req.body.token ||
                req.headers['x-access-token'];
  if (token) {
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        return res.status(403).send(err);
      }
      req.verified = user;
      return next();
    });
  } else {
    res.status(403).send('Token not provided');
  }
  next();
};

/**
   * Sign token with jwt
   * @param {object} payload
   * @returns {string} token
   */
exports.signToken = (payload) => {
  const token = jwt.sign(payload.toJSON(), process.env.SECRET_KEY, {
    expiresIn: '36h'
  });
  return token;
};
