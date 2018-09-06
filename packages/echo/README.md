# Dee Redis Service

A echo service for dee framework which mounts data as service.

## Usage

```ts
import * as DeeEcho from "@sigodenjs/dee-echo";

const data = { k: "v" };
Dee({
  services: {
    echo: {
      initialize: DeeEcho.init<typeof data>,
      args: data
    }
  }
});

srvs.echo.data.k === "v";
```
