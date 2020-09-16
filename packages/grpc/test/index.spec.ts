import * as grpc from "grpc";
import * as path from "path";
import { STOP_KEY } from "@sigodenjs/dee-srv";
import { createSrvLite, delay } from "@sigodenjs/dee-srv-test-utils";
import * as DeeGrpc from "../src";

const RPC_PROTO_FILE = path.resolve(__dirname, "fixtures/rpc.proto");

test("should create grpc service", async () => {
  const srv = await createSrvLite<DeeGrpc.Service<DeeGrpc.Grpc<Clients>, Clients>, DeeGrpc.Args>("grpc", {
    initialize: DeeGrpc.init,
    args: {
      clientProtoFile: RPC_PROTO_FILE,
      serverProtoFile: RPC_PROTO_FILE,
      getClientConstructOptions: () => {
        return {
          address: "127.0.0.1:4444",
          credentials: grpc.credentials.createInsecure(),
        };
      },
      getServerBindOptions: () => {
        return {
          address: "127.0.0.1:4444",
          credentials: grpc.ServerCredentials.createInsecure(),
        };
      },
      serverHandlers: {
        sayHello: async (ctx: DeeGrpc.Context) => {
          await delay(1);
          return { message: ctx.request.name };
        },
      },
    },
  });
  const name = "trump";
  const res = await srv.clients.App.call("sayHello", { name });
  expect(res.message).toBe(name);
  await srv[STOP_KEY]();
});

interface Clients {
  App: string;
}
