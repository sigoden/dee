async function hello(req, res) {
  var value = await delay(10, req.query.name || 'stranger');
  res.json(value);
}

function delay(time, value) {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), time);
  });
}

module.exports = hello;
