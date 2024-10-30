function checkAuthority(req, res, next) {

    if (req.session && req.session.authority === 'User') {
      return next();
    } else {
        res.render('unauthorized-access', { layout: false });
    }
  }

module.exports = { checkAuthority };