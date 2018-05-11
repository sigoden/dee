var Swag = require('../../src');
var path = require('path');


Swag({
  swaggerFile: path.resolve(__dirname, './swagger.yaml'),
  controllers: require('./controllers'),
  services: {
    logger: {
      constructor: require('../../src/services/logger'),
    },
    redis: {
      constructor: require('../../src/services/redis'),
    },
    mongoose: {
      constructor: require('../../src/services/mongoose'),
      constructorArgs: {
        uri: 'mongodb://localhost/test'
      }
    },
    sequelize: {
      constructor: require('../../src/services/sequelize'),
      constructorArgs: {
        database: 'test',
        username: 'root',
        password: 'mysql',
        options: {
          dialect: 'mysql',
          operatorsAliases: false
        }
      }
    },
  }
}, function(err, app) {
  if (err) throw err;
  app.start();
});
