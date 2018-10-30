# Dee Grpc Service

A rpc service for dee framework, powered by grpc

## Usage

```ts
import * as DeeGrpc from "@sigodenjs/dee-grpc";
import * as grpc from "grpc";

Dee({
  services: {
    rpc: {
      initialize: DeeGrpc.init,
      args: {
        clientProtoFile: CLIENT_RPC_PROTO_FILE,
        serverProtoFile: SERVER_RPC_PROTO_FILE,
        getServerBindOptions: () => {
          return {
            address: '127.0.0.1:4444',
            credentials: grpc.ServerCredentials.createInsecure()
          }
        }
        getClientConstructOptions: (serviceName => {
          return {
            address: '127.0.0.1:4444',
            credentials: grpc.credentials.createInsecure()
          }
        })
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
