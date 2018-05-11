async function hello(req, res, next) {
  var name = req.swagger.params.name.value || 'stranger';
  return wrap(name).then(function(v) {
    res.json(name);
    next();
  });
}

async function wrap(v) {
  return new Promise(function(resolve) {
    resolve(v);
  });
}

module.exports = hello;
