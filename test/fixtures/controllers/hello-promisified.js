async function hello(req, res) {
  var name = req.swagger.params.name.value || 'stranger';
  res.json(name);
  return Promise.resolve(name)
}

module.exports = hello;
