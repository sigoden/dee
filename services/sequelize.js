var Sequelize = require('sequelize');
var _ = require('lodash');

/**
 * @params {object} options
 * @params {object} options.constructorArgs - see http://docs.sequelizejs.com/class/lib/sequelize.js~Sequelize.html#instance-constructor-constructor
 */
module.exports = function(options, cb) {
  var srv;
  var constructorArgs = _.get(options, 'constructorArgs');
  if (!_.isPlainObject(constructorArgs)) return cb(new Error('constructorArgs must be an object'));
  srv = new Sequelize(
    constructorArgs.database,
    constructorArgs.username,
    constructorArgs.password,
    constructorArgs.options
  );
  return srv.authenticate().nodeify(function(err) {
    if (err) return cb(err, srv);
    cb(null, srv);
  });
};
