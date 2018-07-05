var initRedis = require('../../../services/redis');

describe('redis', function() {
  test('valid options', function(done) {
    initRedis({
      constructor: initRedis,
      constructorArgs: {
        port: 6479
      }
    }, function(err, srv) {
      expect(err).toBeNull();
      srv.get('test', function(err, value) {
        srv.disconnect();
        done();
      });
    });
  });
  test('invalid options.constructorArgs', function(done) {
    initRedis({
      constructor: initRedis,
      constructorArgs: function() {}
    }, function(err, srv) {
      expect(err.message).toBe('constructorArgs must be an object');
      done();
    });
  });
  test('error', function(done) {
    initRedis({
      constructor: initRedis,
      constructorArgs: {
        port: 6579
      }
    }, function(err, srv) {
      expect(err.message).toBe('connect ECONNREFUSED 127.0.0.1:6579');
      srv.disconnect();
      done();
    });
  });
});
