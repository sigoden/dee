var path = require('path');
var fs = require('fs');
var yaml = require('js-yaml');
var _ = require('lodash');
var deeSwaggerize = require('@sigodenh/dee-swaggerize');

function swaggerize(app, options, cb) {
  let swaggerFile = _.get(options, 'swaggerFile', 'swagger.yaml');
  if (!_.isString(swaggerFile)) return cb(new Error('options.swaggerFile must be a string'));

  loadSwaggerObject(swaggerFile, function(err, api) {
    if (err) return cb(err);
    options.api = api;
    deeSwaggerize(app, options);
    cb(null);
  })
}

function loadSwaggerObject(file, cb) {
  var swaggerFile = path.resolve(file);
  fs.readFile(swaggerFile, 'utf8', function(err, data) {
    if (err) return cb(err);
    var result;
    try {
      if (path.extname(swaggerFile) === '.json') {
        result = JSON.parse(data);
      } else {
        result = yaml.safeLoad(data);
      }
    } catch (err) {
      return cb(new Error('parse file ' + swaggerFile + ' failed, ' + err.message));
    };
    return cb(null, result);
  });
}

module.exports = swaggerize;
