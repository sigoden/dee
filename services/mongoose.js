var mongoose = require('mongoose');
var _ = require('lodash');

/**
 * @params {object} options
 * @params {object} options.constructorArgs.uri -  'mongodb://username:password@host:port/database?options...'
 * @params {object} options.constructorArgs.options - see http://mongoosejs.com/docs/connections.html#options
 */
module.exports = function(options, cb) {
  var constructorArgs = _.get(options, 'constructorArgs');
  if (!_.isPlainObject(constructorArgs)) return cb(new Error('constructorArgs must be an object'));
  mongoose
    .connect(
      constructorArgs.uri,
      constructorArgs.options
    )
    .then(function() {
      cb(null, mongoose);
    })
    .catch(function(err) {
      cb(err, mongoose);
    });
};
