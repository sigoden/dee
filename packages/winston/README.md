# Dee Logger Service

A logger service for dee framework, powered by winston

## Usage

```ts
import * as DeeWinston from "@sigodenjs/dee-winston";

Dee({
  services: {
    logger: {
      initialize: DeeWinston.init,
      args: {
        noConsole: true, // 是否打印日志到终端，默认值 fase
        file: { // winston file transport 参考 https://github.com/winstonjs/winston/blob/master/docs/transports.md#file-transport
          filename: "server.log"
        },
        http: { // winston http transport 参考 https://github.com/winstonjs/winston/blob/master/docs/transports.md#http-transport
          host: "http://example.com"
        },
      }
    }
  }
});

await srvs.logger.error(err);
```
