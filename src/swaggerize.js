var path = require('path');
var fs = require('fs');
var yaml = require('js-yaml');
var _ = require('lodash');
var swaggerTools = require('@sigoden/swagger-tools');

function swaggerize(app, options, cb) {
  let swaggerFile = _.get(options, 'swaggerFile', 'swagger.yaml');
  let prod = _.get(options, 'config.prod', false)
  let controllers = _.get(options, 'controllers', {})
  let securityHandlers = _.get(options, 'securityHandlers', {})
  if (!_.isString(swaggerFile)) return cb(new Error('options.swaggerFile must be a string'));

  loadSwaggerObject(swaggerFile, function(err, swaggerObject) {
    if (err) return cb(err);

    swaggerTools.initializeMiddleware(swaggerObject, function(obj) {
      // if RUNNING_SWAGGER_TOOLS_TESTS is true, obj will be error when initializeMiddleware failed
      if (!_.isPlainObject(obj)) {
        return cb(new Error('initializeMiddleware throw ' + obj));
      }
      var middlewares = obj;
      app.use(middlewares.swaggerMetadata());
      app.use(middlewares.swaggerSecurity({
        securityHandlers: securityHandlers,
      }));
      app.use(middlewares.swaggerValidator());
      app.use(middlewares.swaggerRouter({
        controllers: controllers,
        useStubs: true
      }));
      if (!prod) app.use(middlewares.swaggerUi());
      cb(null);
    })
  })
}

function loadSwaggerObject(file, cb) {
  var swaggerFile = path.resolve(file);
  fs.readFile(swaggerFile, 'utf8', function(err, data) {
    if (err) return cb(err);
    try {
      if (path.extname(swaggerFile) === '.json') {
        return cb(null, JSON.parse(data));
      } else {
        return cb(null, yaml.safeLoad(data));
      }
    } catch (err) {
      return cb(new Error('parse file ' + swaggerFile + ' failed, ' + err.message));
    };
  });
}

module.exports = swaggerize;
