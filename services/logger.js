var winston = require('winston');
var _ = require('lodash');

/**
 * @params {object} options
 * @params {object} options.constructorArgs
 * @params {object} [options.constructorArgs.level]
 * @params {object} [options.constructorArgs.format] - json, logstash, printf, prettyPrint, simple
 * @params {object} [options.constructorArgs.transporters] - {transporterName:transporterOptions}
 */
module.exports = function(options, cb) {
  var constructorArgs = _.get(options, 'constructorArgs', {});
  if (!_.isPlainObject(constructorArgs)) return cb(new Error('constructorArgs must be an object'));
  var transporters = [];
  if (_.isPlainObject(constructorArgs.transporters)) {
    var unsupported = [];
    _.keys(constructorArgs.transporters).map(function(transporterName) {
      if (!winston.transports[transporterName]) {
        return unsupported.push(transporterName);
      }
      var options = constructorArgs.transporters[transporterName];
      var transporter = new winston.transports[transporterName](options);
      transporters.push(transporter);
    });
    if (unsupported.length > 0) {
      return cb(new Error('transporter ' + unsupported.join(',') + ' is not supported'));
    }
  }
  var format = 'simple';
  if (_.isString(constructorArgs.format)) {
    if (!winston.format[constructorArgs.format]) {
      return cb(new Error('format ' + constructorArgs.format + ' is not supported'));
    }
    format = winston.format[constructorArgs.format]();
  }
  var srv = winston.createLogger({
    level: constructorArgs.level || 'info',
    format: format,
    transports: transporters
  });
  return cb(null, srv);
};
