# Dee - Powered by express and swagger

## Features

- Document driven development
- Use swagger to autobind router, auto parse and verify request.
- Easy to use 3-party service, could be bond through config

## Get started

Install Dee web framework

```
npm i @sigodenjs/dee -S
```

Init Dee App

```js
import * as Dee from "@sigodenjs/dee";
import * as path from "path";
import * as handlers from "./handlers";
import * as DeeIORedis from "@sigodenjs/dee-ioredis";

Dee({
  config: {
    ns: "proj",
    name: "App"
  },
  swaggerize: {
    api: path.resolve(__dirname, "./swagger.yaml"), //  Swagger doc file
    handlers
  },
  services: { // auto init and bind service, could be access through app.srvs and req.srvs
    redis: {
      initialize: DeeIORedis.init,
      args: {
        port: 6379
      }
    }
  }
}).then(app => {
  app.start();
});

```

Write route handlers

```js
export async function hello(req: Request, res: Response, next: NextFunction) {
  await sleep(1);
  const name = req.query.name;
  req.srvs.redis // access redis service
  res.json(name);
}
```

## Licese

Copyright (c) 2018 sigoden

Licensed under the MIT license.