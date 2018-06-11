var swaggerize = require('../../src/swaggerize');
var path = require('path');

describe('swaggerize', function() {
  describe('wrong options', function() {
    test('swaggerFile option is undefined', function(done) {
      var app = require('express')();
      swaggerize(app, {}, function(err) {
        expect(err.message).toMatch('ENOENT: no such file or directory');
        done();
      });
    });
    test('swaggerFile option is not string', function(done) {
      var app = require('express')();
      swaggerize(app, { swaggerFile: function() {} }, function(err) {
        expect(err.message).toBe('options.swaggerFile must be a string');
        done();
      });
    });
    test('swaggerFile is json but content is not valid', function(done) {
      var app = require('express')();
      var file = path.resolve(__dirname, '../fixtures/swagger/wrong.json')
      var options = {
        swaggerFile: file,
      };
      swaggerize(app, options, function(err) {
        expect(err.message).toMatch('parse file ' + file + ' failed');
        done();
      });
    });
    test('swaggerFile is yaml but content is not valid', function(done) {
      var app = require('express')();
      var file = path.resolve(__dirname, '../fixtures/swagger/wrong.yaml')
      var options = {
        swaggerFile: file,
      };
      swaggerize(app, options, function(err) {
        expect(err.message).toMatch('parse file ' + file + ' failed');
        done();
      });
    });
  });
  test('valid options', function(done) {
    var app = require('express')();
    var options = {
      swaggerFile: path.resolve(__dirname, '../fixtures/swagger/hello.yaml'),
      handlers: { hello:  function() {} }
    };
    swaggerize(app, options, function(err) {
      expect(err).toBeNull();
      done();
    });
  });
});
