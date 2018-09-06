# Dee Mongo Service

A mongo service for dee framework, powered by mongoose

## Usage

```ts
import * as DeeMongoose from "@sigodenjs/dee-mongoose";

Dee({
  services: {
    mongo: {
      initialize: DeeMongoose.init,
      args: {
        uris: "mongodb://localhost:28017/test"
      }
    }
  }
});

await srvs.mongo.connection.db.command({ping: 1});
```
