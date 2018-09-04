# Dee Logger Service

A logger service for dee framework, powered by winston

## Usage

```ts
import * as DeeWinston from "@sigodenjs/dee-winston";

Dee({
  services: {
    logger: {
      initialize: DeeWinston,
      args: {
        format: "simple",
        level: "debug",
        transporters: {
          Console: {}
        }
      }
    }
  }
});

await srvs.logger.debug("hello");
```
