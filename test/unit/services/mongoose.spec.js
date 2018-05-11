var initMongoose = require('../../../src/services/mongoose');

describe('mongoose', function() {
  test('valid options', function(done) {
    initMongoose({
      constructor: initMongoose,
      constructorArgs: {
        uri: 'mongodb://localhost:28017/test',
        options: {
          autoReconnect: false
        }
      }
    }, function(err, srv) {
      expect(err).toBeNull();
      var model = srv.model('Test', new srv.Schema({ name: String }));
      model.findOne(function(error, result) {
        srv.connection.close();
        done();
      });
    });
  });
  test('invalid options.constructorArgs', function(done) {
    initMongoose({
      constructor: initMongoose,
      constructorArgs: function() {}
    }, function(err, srv) {
      expect(err.message).toBe('constructorArgs must be an object');
      done();
    });
  });
  test('error', function(done) {
    initMongoose({
      constructor: initMongoose,
      constructorArgs: {
        uri: 'mongodb://localhost:29017/test',
        options: {
          autoReconnect: false
        }
      }
    }, function(err, srv) {
      expect(err.message).toMatch('failed to connect to server [localhost:29017] on first connect [MongoNetworkError: connect ECONNREFUSED 127.0.0.1:29017]');
      srv.connection.close();
      done();
    });
  });
});
