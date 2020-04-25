function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = {
  // we are checking only for dummy auth data in query param
  // you would probably check for Authentication header and verify token and extract userId from it
  isAuthenticated: (req, res, next) => {
    if (!req.query.auth) {
      return res.json({ error: true, message:'Please, login!' });
    }
    const userId = parseInt(req.query.auth, 10);

    if (!isNumeric(userId) || userId < 1) {
      return res.json({ error: true, message:'Please provide valid userId!' });
    }

    req.userId = userId;
    next();
  }
};
