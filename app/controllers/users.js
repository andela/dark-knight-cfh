/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  User = mongoose.model('User');
const avatars = require('./avatars').all();
const nodemailer = require('nodemailer');
// const jwt = require('jsonwebtoken');
const { signToken } = require('../../config/middlewares/authorization');

/**
 * Auth callback
 */

exports.authCallback = (req, res) => {
  /* eslint-disable-line */
  if (!req.user) {
    res.redirect('/#!/signin?error=invalid');
  } else {
    const { user } = req;
    const payload = {
      id: user._id || user.id,
      email: user.email || undefined,
      name: user.name,
      avatar: user.avatar
    };
    const token = signToken(payload);
    res.redirect(`/?token=${token}&nothing=nothing`);
  }
};

/**
 * Show login form
 */

exports.signin = (req, res) => {
  if (!req.user) {
    res.redirect('/#!/signin?error=invalid');
  } else {
    res.redirect('/#!/app');
  }
};

/**
 * Show sign up form
 */

exports.signup = (req, res) => {
  if (!req.user) {
    res.redirect('/#!/signup');
  } else {
    res.redirect('/'); // /choose-avatar
  }
};

/**
 * Logout
 */

exports.signout = (req, res) => {
  req.logout();
  res.redirect('/');
};

/**
 * Session
 */

exports.session = (req, res) => {
  res.redirect('/');
};

/**
 * Check avatar - Confirm if the user who logged in via passport
 * already has an avatar. If they don't have one, redirect them
 * to our Choose an Avatar page.
 */

exports.checkAvatar = (req, res) => {
  if (req.user && req.user._id) {
    User.findOne({
      _id: req.user._id
    }).exec((err, user) => {
      if (user.avatar !== undefined) {
        res.redirect('/#!/');
      } else {
        res.redirect('/#!/choose-avatar');
      }
    });
  } else {
    // If user doesn't even exist, redirect to /
    res.redirect('/');
  }
};

/**
 * Create User- Jwt strategy - New
 */

exports.register = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Enter all the fields to signup'
    });
  }
  // return res.send('User saved');
  User.findOne({
    email: req.body.email
  })
    .exec()
    .then((existingUser) => {
      // if user does not exist, save to the db
      if (!existingUser) {
        const user = new User(req.body);
        user
          .save()
          .then((newUser) => {
            newUser.hashed_password = null;
            const payload = {
              _id: newUser._id /* eslint-disable-line */,
              email: newUser.email,
              name: newUser.name,
              avatar: newUser.avatar,
              publicId: newUser.publicId
            };
            const token = signToken(payload);
            return res.status(201).send({
              success: true,
              message: 'Registration successful!',
              token,
              newUser
            });
          })
          .catch(error => res.status(500).json(error.message || 'Unable to create user'));
      } else {
        return res.status(400).json({
          success: false,
          message: 'This user already exists!'
        });
      }
    })
    .catch(error => res.status(500).json(error.message || 'Unable to query the database'));
};

/**
 * Create user
 */

exports.create = (req, res) => {
  if (req.body.name && req.body.password && req.body.email) {
    User.findOne({
      email: req.body.email
    }).exec((err, existingUser) => {
      if (!existingUser) {
        const user = new User(req.body);
        // Switch the user's avatar index to an actual avatar url
        user.avatar = avatars[user.avatar];
        user.provider = 'local';
        user.save((err) => {
          if (err) {
            return res.render('/#!/signup?error=unknown', {
              errors: err.errors,
              user
            });
          }
          req.logIn(user, (err) => {
            if (err) return next(err); /* eslint-disable-line */
            return res.redirect('/#!/');
          });
        });
      } else {
        return res.redirect('/#!/signup?error=existinguser');
      }
    });
  } else {
    return res.redirect('/#!/signup?error=incomplete');
  }
};

exports.search = function (req, res) {
  User.find({}).exec((error, user) => {
    if (error) {
      return res.status(500).send({
        error
      });
    }
    if (user.length === 0) {
      return res.status(404).send({
        status: 'Unsucessful',
        message: 'User not found on db'
      });
    }
    return res.status(200).send({
      status: 'sucessful',
      message: 'Users found',
      user
    });
  });
};

exports.invite = function (req, res) {
  const { email, msg } = req.body;
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'darknight0455@gmail.com',
      pass: 'p3nn1s01'
    }
  });
  const mailOptions = {
    from: 'darknight0455@gmail.com',
    to: email,
    subject: 'Cards for humanity game invite',
    text: msg
  };
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      res.status(500).send({
        status: 'unsuccessful',
        message: 'An error occured!'
      });
    } else {
      res.status(200).send({
        status: 'Successful',
        message: `Invite successfully sent - ${info}`
      });
    }
  });
};
/**
 * Assign avatar to user
 */

exports.avatars = (req, res) => {
  // Update the current user's profile to include the avatar choice they've made
  if (req.user && req.user._id && req.body.avatar !== undefined && /\d/.test(req.body.avatar) && avatars[req.body.avatar]) {
    User.findOne({
      _id: req.user._id
    }).exec((err, user) => {
      user.avatar = avatars[req.body.avatar];
      user.save();
    });
  }
  return res.redirect('/#!/app');
};

exports.addDonation = (req, res) => {
  if (req.body && req.user && req.user._id) {
    // Verify that the object contains crowdrise data
    if (req.body.amount && req.body.crowdrise_donation_id && req.body.donor_name) {
      User.findOne({
        _id: req.user._id
      }).exec((err, user) => {
        // Confirm that this object hasn't already been entered
        let duplicate = false;
        for (let i = 0; i < user.donations.length; i++) {
          /* eslint-disable-line */
          if (user.donations[i].crowdrise_donation_id === req.body.crowdrise_donation_id) {
            duplicate = true;
          }
        }
        if (!duplicate) {
          // console.log('Validated donation');
          user.donations.push(req.body);
          user.premium = 1;
          user.save();
        }
      });
    }
  }
  res.send();
};

/**
 *  Show profile
 */

exports.show = (req, res) => {
  const user = req.profile;

  res.render('users/show', {
    title: user.name,
    user
  });
};

/**
 * Send User
 */

exports.me = (req, res) => {
  res.jsonp(req.user || null);
};

/**
 * Find user by id
 */

exports.user = (req, res, next, id) => {
  User.findOne({
    _id: id
  }).exec((err, user) => {
    if (err) return next(err);
    if (!user) {
      return next(new Error(`Failed to load User ${id}`));
    } /* eslint-disable-line */
    req.profile = user;
    next();
  });
};

/**
 * @description returns user data and info
 *
 * @param {object} req
 * @param {object} res
 *
 * @returns {object} user object
 */
exports.profile = (req, res) => {
  const userID = req.verified._id || req.verified.id;
  User.findOne({
    _id: userID
  })
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      user.hashed_password = null;
      return res.status(200).json({
        user
      });
    })
    .catch(error => res.status(500).json(error.message || 'Unable to query the database'));
};
/**
 * @description Function to get users order by descending points
 * @param {object} req
 * @param {object} res
 * @returns {object} json object containing array of user objects
 */
exports.leaderboard = (req, res) => {
  const pageOptions = {
    page: parseInt(req.query.page, 10) || 0,
    limit: parseInt(req.query.limit, 10) || 15,
    canFetchMore: false
  };

  User.count({})
    .then((count) => {
      if (!count) return res.json({ msg: 'database error' });

      const numOfPages = Math.ceil(count / pageOptions.limit);
      // if (pageOptions.limit * pageOptions.page )
      User.find()
        .sort({ points: -1 })
        .skip(pageOptions.page * pageOptions.limit)
        .limit(pageOptions.limit)
        .exec()
        .then((users) => {
          if (!users) {
            return res.status(404).json({
              message: 'No Users found'
            });
          }
          // nullify user password
          const secureUsers = users.map((user) => {
            user.hashed_password = null;
            return user;
          });
          return res.status(200).json({
            secureUsers,
            count,
            numOfPages
          });
        })
        .catch(error => res.status(500).json(error.message || 'Unable to query the database'));
    })
    .catch(error =>
      res.status(500).json({
        message: error.message || 'Unable to query the database'
      }));
};

/**
 * Find donations by user ID
 * @param {object} req
 * @param {object} res
 * @returns {object}
 */

exports.getDonation = (req, res) => {
  const userID = req.verified._id;
  User.findOne(
    {
      _id: userID
    },
    'donations'
  )
    .exec()
    .then((user) => {
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      return res.status(200).json({
        user
      });
    })
    .catch(error => res.status(500).json(error.message || 'Unable to query the database'));
};
