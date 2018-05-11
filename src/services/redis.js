var Redis = require('ioredis');
var _ = require('lodash');

/**
 * @params {object} options
 * @params {object} options.constructorArgs - see https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options
 */
module.exports = function (options, cb) {
  var constructorArgs = _.get(options, 'constructorArgs', {});
  if (!_.isPlainObject(constructorArgs)) return cb(new Error('constructorArgs must be an object'));
  var srv = new Redis(constructorArgs);
  srv.on('ready', function() {
    cb(null, srv);
  });
  srv.on('error', function(err) {
    cb(err, srv);
  });
};
