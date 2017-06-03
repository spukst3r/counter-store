function noDelay(req, res, next) {
  req.connection.setNoDelay(true);

  next();
}


module.exports = noDelay;
