# Dee SQL Service

A sql service for dee framework, powered by sequelize

## Usage

```ts
import * as DeeSequelize from "@sigodenjs/dee-sequelize";

class User extends Model { }

const ModelMap = {
  User: User,
};


Dee({
  services: {
    sql: {
      initialize: DeeSequelize.init,
      args: {
        database: "mysql",
        username: "root",
        password: "mysql",
        models: ModelMap,
        options: {
          port: 3406,
          dialect: "mysql",
          logging: false
        }
      }
    }
  }
});

await srvs.sql.query("select 1", { type: srvs.sql.QueryTypes.SELECT });
```
