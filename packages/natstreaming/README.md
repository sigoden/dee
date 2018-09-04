# Dee MQ Service

A mq service for dee framework, powered by nats-streaming

## Usage

```ts
import * as DeeNatstreaming from "@sigodenjs/dee-natstreaming";

Dee({
  services: {
    mq: {
      initialize: DeeNatstreaming,
      args: {
        client: {
          clusterId: "test-cluster",
          stanOptions: {
            url: "nats://localhost:4222"
          }
        },
        producers: {
          sayHello: {
            schema: {
              name: { type: "string" }
            }
          }
        },
        subscribers: {
          "App.sayHello": {}
        },
        handlers: {
          "App.sayHello": (ctx: DeeNatstreaming.Context) => {
            expect(ctx.srvs).toBeDefined();
            expect(ctx.msg.getData().toString()).toBe('{"name":"tom"}');
          }
        }
      }
    }
  }
});

await srvs.mq.producers.sayHello({ name: "tom" });
```
