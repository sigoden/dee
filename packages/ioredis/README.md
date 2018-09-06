# Dee Redis Service

A redis service for dee framework, powered by ioredis

## Usage

```ts
import * as DeeIORedis from "@sigodenjs/dee-ioredis";

Dee({
  services: {
    redis: {
        initialize: DeeIORedis.init,
        args: {
            port: 6379
        }
    }
  }
})

await srvs.redis.ping()
```