# Dee SQL Service

A sql service for dee framework, powered by sequelize

## Usage

```ts
import * as DeeSequelize from "@sigodenjs/dee-sequelize";

Dee({
  services: {
    sql: {
      initialize: DeeSequelize,
      args: {
        database: "mysql",
        username: "root",
        password: "mysql",
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
