
function hello (req, res, next) {
  var name = req.swagger.params.name.value || 'stranger';
  res.json(name);
}

module.exports = { hello };
