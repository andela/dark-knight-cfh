/**
 * Redirect users to /#!/app (forcing Angular to reload the page)
 * @param {object} req
 * @param {object} res
 * @returns {redirects} redirects
 */
exports.play = (req, res) => {
  if (Object.keys(req.query)[0] === 'custom') {
    res.redirect('/#!/app?custom');
  } else {
    res.redirect('/#!/app');
  }
};

exports.render = (req, res) => {
  res.render('index', {
    user: req.user ? JSON.stringify(req.user) : 'null',
    token: req.query.token ? req.query.token : undefined
  });
};
