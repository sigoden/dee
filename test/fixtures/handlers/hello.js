function hello(req, res, next) {
  var name = req.query.name || 'stranger';
  res.json(name);
  next();
}

module.exports = hello;
