# Dee - 框架

## 特点

- 设计驱动开发
- 使用 swagger 注册路由，解析并校验请求，提高开发效率
- 预置精选第三方服务，可以使用配置初始化并绑定
- 路由支持 promsie

## 入门

安装 Dee 框架

```
npm i @sigodenjs/dee -S
```

初始化 Dee

```js
import * as Dee from "@sigodenjs/dee";
import * as path from "path";
import * as handlers from "./handlers";
import * as DeeRedis from "@sigodenjs/dee-ioredis";

Dee({
  config: {
    ns: "proj",
    name: "App"
  },
  swaggerize: {
    api: path.resolve(__dirname, "./swagger.yaml"), // 指向 Swagger 文档文件
    handlers
  },
  services: { // 自动初始化并绑定服务，可以在 app.srvs 和 req.srvs 中获取
    redis: {
      initialize: DeeRedis,
      args: {
        port: 6379
      }
    }
  }
}).then(app => {
  app.start();
});

```

路由函数

```js
export async function hello(req: Request, res: Response, next: NextFunction) {
  await sleep(1);
  const name = req.query.name;
  req.srvs.redis // 可以获取 redis 服务
  res.json(name);
}
```

## Licese

Copyright (c) 2018 sigoden

Licensed under the MIT license.