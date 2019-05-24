import * as grpc from "grpc";
import * as path from "path";
import { delay, HANDLERS, initApp } from "../../core/test-utils";
import * as DeeGrpc from "../src";

const RPC_PROTO_FILE = path.resolve(__dirname, "fixtures/rpc.proto");

test("should create grpc service", async () => {
  const serviceOptions = <DeeGrpc.ServiceOptions>{
    initialize: DeeGrpc.init,
    args: {
      clientProtoFile: RPC_PROTO_FILE,
      serverProtoFile: RPC_PROTO_FILE,
      getClientConstructOptions: () => {
        return {
          address: "127.0.0.1:4444",
          credentials: grpc.credentials.createInsecure()
        };
      },
      getServerBindOptions: () => {
        return {
          address: "127.0.0.1:4444",
          credentials: grpc.ServerCredentials.createInsecure()
        };
      },
      serverHandlers: {
        sayHello: async (ctx: DeeGrpc.Context) => {
          await delay(1);
          return { message: ctx.request.name };
        }
      }
    }
  };
  const app = await initApp(HANDLERS, { rpc: serviceOptions });
  const srv = <DeeGrpc.Service<Clients>>app.srvs.rpc;
  const name = "trump";
  const res = await srv.clients.App.call("sayHello", { name });
  expect(res.message).toBe(name);
  srv.server.tryShutdown(() => {});
});

interface Clients {
  App: string;
}
