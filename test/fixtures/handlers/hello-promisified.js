async function hello(req, res) {
  var name = req.query.name || 'stranger';
  res.json(name);
  return Promise.resolve(name)
}

module.exports = hello;
