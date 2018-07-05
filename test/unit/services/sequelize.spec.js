var initSequelize = require('../../../services/sequelize');

describe('sequelize', function() {
  test('valid options', function(done) {
    initSequelize({
      constructor: initSequelize,
      constructorArgs: {
        database: 'mysql',
        username: 'root',
        password: 'mysql',
        options: {
          dialect: 'mysql',
          port: 3406,
          operatorsAliases: false,
          logging: false
        }
      }
    }, function(err, srv) {
      expect(err).toBeNull();
      srv.query('SELECT 1 + 1').then(function() {
        srv.close();
        done();
      }).catch(function(err) {
        console.log(err);
        done();
      });
    });
  });
  test('invalid options.constructorArgs', function(done) {
    initSequelize({
      constructor: initSequelize,
      constructorArgs: function() {}
    }, function(err, srv) {
      expect(err.message).toBe('constructorArgs must be an object');
      done();
    });
  });
  test('error', function(done) {
    initSequelize({
      constructor: initSequelize,
      constructorArgs: {
        database: 'mysql',
        username: 'root',
        password: 'doknow',
        options: {
          port: 3406,
          dialect: 'mysql',
          operatorsAliases: false,
          logging: false
        }
      }
    }, function(err, srv) {
      expect(err.message).toMatch('Access denied for user');
      srv.close();
      done();
    });
  });
});
