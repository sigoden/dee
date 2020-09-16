# Dee - Powered by express and openapi

## Features

- Document driven development
- Use openapi to autobind router, auto parse and verify request.
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

Dee.init({
  config: {
    ns: "proj",
    name: "App"
  },
  openapize: {
    api: path.resolve(__dirname, "./openapi.yaml"), //  Openapi doc file
    handlers
  },
  services: {
    // auto init and bind service, could be access through app.srvs and req.srvs
    redis: {
      initialize: DeeIORedis.init
    }
  },
  errorHandler(
    err: Error,
    req: Dee.Request,
    res: Dee.Response,
    next: Dee.NextFunction
  ) {
    if(err instanceof Dee.ValidationError) {
      res.status(400);
      res.json({code: "ErrValidation", message: "Validation Error",  extra: err.errors });
      return;
    }
    res.status(500);
    res.json({code: "ErrFatal", message: err.message});
  },
}).then(app => {
  app.start();
}).catch(err => {
  console.error(err);
});

```

Write openapi doc
```yaml
openapi: 3.0.0
info:
  version: 0.0.1
  title: rbac
servers:
  - url: "http://localhost:3000/"
paths:
  /hello:
    get:
      description: Returns 'Hello' to the caller
      operationId: hello
      parameters:
        - in: query
          name: name
          schema:
            type: string
            format: int64
      responses:
        "200":
          description: ''
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/MessageResponse"
components:
  schemas:
    MessageResponse:
      type: object
      properties:
        message:
          type: string
      required:
        - message
```

Write route handlers at `handlers/index.ts`

```js
import { Request, Response, NextFunction } from "@sigodenjs/dee";
export async function hello(req: Request, res: Response, next: NextFunction) {
  const name = req.query.name;
  req.srvs.redis; // access redis service
  res.json({message: `hello ${name}`});
}
```

run server

```sh
ts-node index.ts
```

test server
```
$ curl localhost:3000/hello?name=dee
{"message":"hello dee"}
```

## Licese

Copyright (c) 2020 sigoden

Licensed under the MIT license.
