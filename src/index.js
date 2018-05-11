var express = require('express')
var _ = require('lodash');
var asy = require('async');
var swaggerize = require('./swaggerize');

function Swag(options, cb) {
  var app = express();
  if (!_.isPlainObject(options)) return cb(new Error('options must be an object'));
  if (!_.isPlainObject(options.config || {})) return cb(new Error('options.config must be an object'));
  if (!_.isPlainObject(options.services || {})) return cb(new Error('options.services must be an object'));
  createSrvs(options.config, options.services, function(err, srvs) {
    if (err) return cb(err);
    app.use(function(req, res, next) {
      req.swag = {
        srvs: srvs,
        config: options.config
      }
      next();
    });
    try {
      useMiddlewares(app, options.beforeRoute);
    } catch (err) {
      return cb(new Error('options.beforeRoute is not valid, ' + err.message));
    }

    if (!_.isPlainObject(options.controllers)) return cb(new Error('options.controllers must be an object'));
    var invalidControllers = []
    _.keys(options.controllers).forEach(function (operationId) {
      var func = options.controllers[operationId];
      if (!_.isFunction(func)) {
        invalidControllers.push(operationId);
      }
      options.controllers[operationId] = function(req, res, next) {
        if (Object.prototype.toString.call(func) !== '[object AsyncFunction]') {
          func(req, res, next);
        } else {
          func(req, res, next).then(next).catch(next);
        }
      };
    });
    if (invalidControllers.length > 0) {
      return cb(new Error('options.controllers.' + invalidControllers.join(',') + ' value must be a function'));
    }

    var errorHandler = _.get(options, 'errorHandler');
    if (errorHandler && !_.isFunction(errorHandler)) {
      return cb(new Error('options.errorHandler values must be a function'));
    }

    swaggerize(app, options, function(err) {
      if (err) return cb(err);
      try {
        useMiddlewares(app, options.afterRoute);
      } catch (err) {
        return cb(new Error('options.afterRoute is not valid, ' + err.message));
      }

      if (errorHandler) {
        app.use(errorHandler);
      }

      var instance = {
        srvs: srvs,
        controllers: options.controllers,
        config: options.config,
        express: app
      };
      instance.start = function() {
        var port = _.get(options, 'config.port', 3000);
        var host = _.get(options, 'config.host');
        var server = app.listen(port, host)
        return server
      };
      var readyFunc = options.ready;
      try {
        if (_.isFunction(readyFunc)) readyFunc(instance);
      } catch (err) {
        return cb(err);
      }
      return cb(null, instance);
    });
  });
}

function createSrvs(config, servicesOpts, cb) {
  var srvsObj = {}
  var getService = function(path) {
    return _.get(srvsObj, path);
  };
  var createSrv = function(srvName, cb) {
    var srvOpts = servicesOpts[srvName];
    if (!_.isPlainObject(srvOpts)) return cb(new Error('service.' + srvName + ' must be an object'));
    var srvConstructor;
    if (_.isFunction(srvOpts.constructor)) {
      srvConstructor = srvOpts.constructor;
    } else if (_.isString(srvOpts.constructor)) {
      try {
        srvConstructor = require(srvOpts.constructor);
      } catch (err) {
        return cb(new Error('service.' + srvName + '.constructor is not a module'));
      }
    } else {
      return cb(new Error('service.' + srvName + '.constructor is not a string nor function'))
    }
    srvConstructor(srvOpts, function(err, srv) {
      if (err) {
        var wrapErr = new Error('service.' + srvName + ' has error, ' + err.message);
        return cb(wrapErr);
      }
      srv.name = srvName;
      srv.getService = getService;
      return cb(null, srv);
    });
  };
  asy.map(_.keys(servicesOpts), createSrv, function(err, srvs) {
    if (err) return cb(err);
    _.reduce(srvs, function(obj, srv) {
      obj[srv.name] = srv;
      return obj;
    }, srvsObj);
    return cb(null, srvsObj);
  });
}

function useMiddlewares(app, hook) {
  if (_.isUndefined(hook)) return;
  if (_.isFunction(hook)) {
    hook(app);
    return;
  }
  if (_.isArray(hook)) {
    _.each(hook, function(mid) {
      app.use(mid);
    })
    return;
  }
  throw new Error('not a function nor array of functions');
}

module.exports = Swag;
