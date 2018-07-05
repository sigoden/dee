var initLogger = require('../../../services/logger');
var path = require('path');

describe('logger', function() {
  test('valid options', function(done) {
    initLogger(
      {
        constructor: initLogger,
        constructorArgs: {
          level: 'info',
          format: 'json',
          transporters: {
            File: {
              filename: path.resolve(__dirname, '../fixtures/logger/my.log')
            }
          }
        }
      },
      function(err, srv) {
        expect(err).toBeNull();
        srv.info('it works');
        done();
      }
    );
  });
  test('mini options', function(done) {
    initLogger(
      {
        constructor: initLogger
      },
      function(err, srv) {
        expect(err).toBeNull();
        done();
      }
    );
  });
  test('invalid options.constructorArgs', function(done) {
    initLogger(
      {
        constructor: initLogger,
        constructorArgs: function() {}
      },
      function(err, srv) {
        expect(err.message).toBe('constructorArgs must be an object');
        done();
      }
    );
  });
  test('invalid options.constructorArgs.transporters', function(done) {
    initLogger(
      {
        constructor: initLogger,
        constructorArgs: {
          transporters: {
            404: {}
          }
        }
      },
      function(err, srv) {
        expect(err.message).toBe('transporter 404 is not supported');
        done();
      }
    );
  });
  test('invalid options.constructorArgs.format', function(done) {
    initLogger(
      {
        constructor: initLogger,
        constructorArgs: {
          format: '404'
        }
      },
      function(err, srv) {
        expect(err.message).toBe('format 404 is not supported');
        done();
      }
    );
  });
});
