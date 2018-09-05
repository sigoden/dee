# Dee Grpc Service

A rpc service for dee framework, powered by grpc

## Usage

```ts
import * as DeeGrpc from "@sigodenjs/dee-grpc";

Dee({
  services: {
    rpc: {
      initialize: DeeGrpc,
      args: {
        clientProtoFile: CLIENT_RPC_PROTO_FILE,
        serverProtoFile: SERVER_RPC_PROTO_FILE,
        serverPort: 4444,
        getClientUri: () => "localhost:4444",
        serverHandlers: {
          sayHello: async (ctx: DeeGrpc.Context) => {
            await delay(1);
            return { message: ctx.request.name };
          }
        }
      }
    }
  }
});

/**
 * Client call rpc function
 *
 * service App {
 *   // Sends a greeting
 *   rpc SayHello (HelloRequest) returns (HelloReply) {}
 * }
 */
await srvs.rpc.clients.App.call("sayHello", { name });
```
