import * as path from "path";
import * as DeeGrpc from "../src";
import { initApp, HANDLERS, delay } from "../../core/test-utils";

const RPC_PROTO_FILE = path.resolve(__dirname, "fixtures/rpc.proto");

test("should create grpc service", async () => {
  const serviceOptions = <DeeGrpc.ServiceOptions>{
    initialize: DeeGrpc,
    args: {
      clientProtoFile: RPC_PROTO_FILE,
      serverProtoFile: RPC_PROTO_FILE,
      serverPort: 4444,
      getClientUri: () => "localhost:4444",
      serverHandlers: {
        sayHello: async (ctx: DeeGrpc.Context) => {
          await delay(1);
          return { message: ctx.request.name };
        }
      }
    }
  };
  const app = await initApp(HANDLERS, { rpc: serviceOptions });
  const srv = <DeeGrpc.Service>app.srvs.rpc;
  const name = "trump";
  const res = await srv.clients.App.call("sayHello", { name });
  expect(res.message).toBe(name);
  srv.server.tryShutdown(() => {});
});
