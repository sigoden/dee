# Dee Redis Service

A redis service for dee framework, powered by ioredis

## Usage

```ts
import * as DeeRedis from "@sigodenjs/dee-ioredis";

Dee({
  services: {
    redis: {
        initialize: DeeRedis,
        args: {
            port: 6379
        }
    }
  }
})

await srvs.redis.ping()
```