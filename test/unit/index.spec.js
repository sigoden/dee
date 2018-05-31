var Swag = require('../../src');
var request = require('supertest');
var path = require('path');

describe('Swag', function() {
  test('minimal options', function(done) {
    Swag({
      swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
      controllers: {
        hello: require('../fixtures/controllers/hello')
      },
    }, function(err, swag) {
      expect(err).toBeNull();
      request(swag.express)
        .get('/hello?name=tome')
        .expect(200)
        .end(function(err, res) {
          expect(err).toBeNull();
          expect(res.body).toBe('tome');
          done();
        });
    });
  });
  test('async handler', function(done) {
    Swag({
      swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
      controllers: {
        hello: require('../fixtures/controllers/hello-promisified')
      },
    }, function(err, swag) {
      expect(err).toBeNull();
      request(swag.express)
        .get('/hello?name=tome')
        .expect(200)
        .end(function(err, res) {
          expect(err).toBeNull();
          expect(res.body).toBe('tome');
          done();
        });
    });
  });
  test('full options', function(done) {
    var beforeRouteMid = jest.fn(function(req, res, next) { next(); });
    var afterRouteMid = jest.fn(function(req, res, next) { next(); });
    var errorHandler = jest.fn(function(err, req, res, next) { res.end(err.message) });
    var ready = jest.fn();
    var config = {
      host: 'localhost',
      port: 13000,
      prod: false
    };
    var controllerFunc = jest.fn();
    var srv = {};
    Swag({
      config: config,
      swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
      controllers: {
        hello: function(req, res, next) {
          expect(req.swagger).toBeDefined()
          expect(req.swagger.params).toBeDefined()
          expect(req.swag.srvs).toBeDefined();
          expect(req.swag.srvs.srv).toBeDefined();
          expect(req.swag.srvs.$config).toEqual(config);
          controllerFunc();
          res.end();
          next();
        }
      },
      beforeRoute: function(app) {
        app.use(beforeRouteMid);
      },
      afterRoute: [ afterRouteMid ],
      errorHandler: errorHandler,
      ready: ready,
      services: {
        srv: {
          constructor: jest.fn(function(opts, callback) { callback(null, srv); })
        }
      }
    }, function(err, swag) {
      expect(err).toBeNull();
      expect(ready).toHaveBeenCalledWith(swag);
      request(swag.express)
        .get('/hello')
        .expect(200)
        .end(function(err, res) {
          expect(err).toBeNull();
          expect(res.text).toBe('');
          expect(beforeRouteMid).toHaveBeenCalledTimes(1);
          expect(afterRouteMid).toHaveBeenCalledTimes(1);
          expect(errorHandler).toHaveBeenCalledTimes(0);
          controllerFunc.mockImplementation(function() {
            throw new Error('ops, something wrong');
          });
          request(swag.express)
            .get('/hello')
            .expect(200)
            .end(function(err, res) {
              expect(err).toBeNull();
              expect(res.text).toBe('ops, something wrong');
              expect(beforeRouteMid).toHaveBeenCalledTimes(2);
              expect(afterRouteMid).toHaveBeenCalledTimes(1);
              expect(errorHandler).toHaveBeenCalledTimes(1);
              done();
            });
        });
    });
  });
  describe('wrong options', function() {
    test('options is not an object', function(done) {
      Swag('', function(err) {
        expect(err.message).toBe('options must be an object');
        done();
      });
    });
    test('options.config is not an object', function(done) {
      Swag({ config: [] }, function(err) {
        expect(err.message).toBe('options.config must be an object');
        done();
      });
    });
    test('options.services is not an object', function(done) {
      Swag({ services: [] }, function(err) {
        expect(err.message).toBe('options.services must be an object');
        done();
      });
    });
    test('options.swaggerFile is not valid', function(done) {
      Swag({ swaggerFile: '404', controllers: {} }, function(err) {
        expect(err.message).toMatch('ENOENT: no such file or directory');
        done();
      });
    });
    describe('options.services element', function() {
      test('its value is not an object', function(done) {
        Swag({ services: { srv: [] } }, function(err) {
          expect(err.message).toBe('service.srv must be an object');
          done();
        });
      });
      test('element.controller is string but it is not a module', function(done) {
        Swag({ services: { srv: { constructor: '404' } } }, function(err) {
          expect(err.message).toBe('service.srv.constructor is not a module');
          done();
        });
      });
      test('element.controller is not a string nor function', function(done) {
        Swag({ services: { srv: { constructor: { } } } }, function(err) {
          expect(err.message).toBe('service.srv.constructor is not a string nor function');
          done();
        });
      });
      test('element.constructor exectue failed', function(done) {
        var func = jest.fn(function(opts, callback) {  callback(new Error('srv wrong')) });
        Swag({ services: { srv: { constructor: func } } }, function(err) {
          expect(err.message).toBe('service.srv has error, srv wrong');
          done();
        });
      });
    });
    test('options.controllers is not object', function(done) {
      Swag({ controllers: [] }, function(err) {
        expect(err.message).toBe('options.controllers must be an object');
        done();
      });
    });
    test('options.controllers item value is not function', function(done) {
      Swag({ controllers: { operationId: {} }}, function(err) {
        expect(err.message).toBe('options.controllers.operationId value must be a function');
        done();
      });
    });
    test('options.errorHandler is not function', function(done) {
      Swag({ errorHandler: {}, controllers: {} }, function(err) {
        expect(err.message).toBe('options.errorHandler values must be a function');
        done();
      });
    });
    test('options.beforeRoute is not a function or function array', function(done) {
      Swag({ beforeRoute: {} }, function(err) {
        expect(err.message).toBe('options.beforeRoute is not valid, not a function nor array of functions');
        done();
      });
    });
    test('options.afterRoute is not a function or function array', function(done) {
      Swag({
        swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
        controllers: {
          hello: require('../fixtures/controllers/hello')
        },
        afterRoute: {} 
      }, function(err) {
        expect(err.message).toBe('options.afterRoute is not valid, not a function nor array of functions');
        done();
      });
    });
    test('options.ready throw error', function(done) {
      var err = new Error('ready func wrong');
      Swag({
        swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
        controllers: {
          hello: require('../fixtures/controllers/hello')
        },
        ready: jest.fn(function() { throw err })
      }, function(err) {
        expect(err).toBe(err);
        done();
      });
    })
  });
  test('srv.getService', function(done) {
    var srv = {}
    Swag({
      swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
      controllers: {
        hello: require('../fixtures/controllers/hello')
      },
      services: {
        srv: {
          constructor: jest.fn(function(opts, callback) { callback(null, srv); })
        }
      }
    }, function(err, swag) {
      expect(err).toBeNull();
      expect(srv.getService('srv')).toBe(srv);
      done();
    });
  });
  test('swag.start', function(done) {
    Swag({
      swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
      controllers: {
        hello: require('../fixtures/controllers/hello')
      }
    }, function(err, swag) {
      expect(err).toBeNull();
      var server = swag.start()
      server.close();
      done();
    });
  });
})
