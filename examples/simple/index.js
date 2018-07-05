var Dee = require('../../');
var path = require('path');

Dee(
  {
    swaggerize: {
      swaggerFile: path.resolve(__dirname, './swagger.yaml'),
      handlers: require('./handlers')
    },
    services: {
      logger: {
        constructor: require('../../services/logger')
      },
      redis: {
        constructor: require('../../services/redis')
      },
      mongoose: {
        constructor: require('../../services/mongoose'),
        constructorArgs: {
          uri: 'mongodb://localhost/test'
        }
      },
      sequelize: {
        constructor: require('../../services/sequelize'),
        constructorArgs: {
          database: 'test',
          username: 'root',
          password: 'mysql',
          options: {
            dialect: 'mysql',
            operatorsAliases: false
          }
        }
      }
    }
  },
  function(err, app) {
    if (err) throw err;
    app.start();
  }
);
