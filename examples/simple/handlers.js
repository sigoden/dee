
function hello (req, res, next) {
  var name = req.params.name || 'stranger';
  res.json(name);
}

module.exports = { hello };
