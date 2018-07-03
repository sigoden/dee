var Dee = require('../../src');
var request = require('supertest');
var path = require('path');

describe('Dee', function() {
  test('minimal options', function(done) {
    Dee({
      swaggerize: {
        swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
        handlers: {
          hello: require('../fixtures/handlers/hello')
        },
      }
    }, function(err, dee) {
      expect(err).toBeNull();
      request(dee.express)
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
    Dee({
      swaggerize: {
        swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
        handlers: {
          hello: require('../fixtures/handlers/hello-promisified')
        },
      }
    }, function(err, dee) {
      expect(err).toBeNull();
      request(dee.express)
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
    var handlerFunc = jest.fn();
    var srv = {};
    Dee({
      config: config,
      swaggerize: {
        swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
        handlers: {
          hello: function(req, res, next) {
            expect(req.srvs).toBeDefined();
            expect(req.srvs.srv).toBeDefined();
            expect(req.srvs.$config).toEqual(config);
            handlerFunc();
            res.end();
            next();
          }
        },
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
    }, function(err, dee) {
      expect(err).toBeNull();
      expect(ready).toHaveBeenCalledWith(dee);
      request(dee.express)
        .get('/hello')
        .expect(200)
        .end(function(err, res) {
          expect(err).toBeNull();
          expect(res.text).toBe('');
          expect(beforeRouteMid).toHaveBeenCalledTimes(1);
          expect(afterRouteMid).toHaveBeenCalledTimes(1);
          expect(errorHandler).toHaveBeenCalledTimes(0);
          handlerFunc.mockImplementation(function() {
            throw new Error('ops, something wrong');
          });
          request(dee.express)
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
      Dee('', function(err) {
        expect(err.message).toBe('options must be an object');
        done();
      });
    });
    test('options.config is not an object', function(done) {
      Dee({ config: [] }, function(err) {
        expect(err.message).toBe('options.config must be an object');
        done();
      });
    });
    test('options.swaggerize is not an object', function(done) {
      Dee({ swaggerize: [] }, function(err) {
        expect(err.message).toBe('options.swaggerize must be an object');
        done();
      });
    });
    test('options.services is not an object', function(done) {
      Dee({ swaggerize: {}, services: [] }, function(err) {
        expect(err.message).toBe('options.services must be an object');
        done();
      });
    });
    test('options.swaggerize.swaggerFile is not valid', function(done) {
      Dee({ swaggerize: { swaggerFile: '404', handlers: {} } }, function(err) {
        expect(err.message).toMatch('ENOENT: no such file or directory');
        done();
      });
    });
    describe('options.services element', function() {
      test('its value is not an object', function(done) {
        Dee({ swaggerize: {}, services: { srv: [] } }, function(err) {
          expect(err.message).toBe('service.srv must be an object');
          done();
        });
      });
      test('srv.constructor is string but it is not a module', function(done) {
        Dee({ swaggerize: {}, services: { srv: { constructor: '404' } } }, function(err) {
          expect(err.message).toBe('service.srv.constructor is not a module');
          done();
        });
      });
      test('srv.constructor is not a string nor function', function(done) {
        Dee({ swaggerize: {}, services: { srv: { constructor: { } } } }, function(err) {
          expect(err.message).toBe('service.srv.constructor is not a string nor function');
          done();
        });
      });
      test('srv.constructor exectue failed', function(done) {
        var func = jest.fn(function(opts, callback) {  callback(new Error('srv wrong')) });
        Dee({ swaggerize: {}, services: { srv: { constructor: func } } }, function(err) {
          expect(err.message).toBe('service.srv has error, srv wrong');
          done();
        });
      });
    });
    test('options.swaggerize.handlers is not object', function(done) {
      Dee({ swaggerize: { handlers: [] } }, function(err) {
        expect(err.message).toBe('options.swaggerize.handlers must be an object');
        done();
      });
    });
    test('options.swaggerize.handlers item value is not function', function(done) {
      Dee({ swaggerize: { handlers: { operationId: {} }}}, function(err) {
        expect(err.message).toBe('options.handlers.operationId value must be a function');
        done();
      });
    });
    test('options.errorHandler is not function', function(done) {
      Dee({ errorHandler: {}, swaggerize: { handlers: {} }}, function(err) {
        expect(err.message).toBe('options.errorHandler values must be a function');
        done();
      });
    });
    test('options.beforeRoute is not a function or function array', function(done) {
      Dee({ beforeRoute: {}, swaggerize: { handlers: {} }}, function(err) {
        expect(err.message).toBe('options.beforeRoute is not valid, not a function nor array of functions');
        done();
      });
    });
    test('options.afterRoute is not a function or function array', function(done) {
      Dee({
        swaggerize: {
          swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
          handlers: {
            hello: require('../fixtures/handlers/hello')
          },
        },
        afterRoute: {} 
      }, function(err) {
        expect(err.message).toBe('options.afterRoute is not valid, not a function nor array of functions');
        done();
      });
    });
    test('options.ready throw error', function(done) {
      var readyErr = new Error('ready func wrong');
      Dee({
        swaggerize: {
          swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
          handlers: {
            hello: require('../fixtures/handlers/hello')
          },
        },
        ready: jest.fn(function() { throw readyErr })
      }, function(err) {
        expect(err).toBe(readyErr);
        done();
      });
    })
  });
  test('srv.getService', function(done) {
    var srv = {}
    Dee({
      swaggerize: {
        swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
        handlers: {
          hello: require('../fixtures/handlers/hello')
        },
      },
      services: {
        srv: {
          constructor: jest.fn(function(opts, callback) { callback(null, srv); })
        }
      }
    }, function(err, dee) {
      expect(err).toBeNull();
      expect(srv.getService('srv')).toBe(srv);
      done();
    });
  });
  test('dee.start', function(done) {
    Dee({
      swaggerize: {
        swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
        handlers: {
          hello: require('../fixtures/handlers/hello')
        }
      }
    }, function(err, dee) {
      expect(err).toBeNull();
      var server = dee.start()
      server.close();
      done();
    });
  });
})
