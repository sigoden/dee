import * as path from "path";
import * as DeeRedis from "../src";
import { initApp, HANDLERS } from "@sigodenjs/dee-test-utils";

const RPC_PROTO_FILE = path.resolve(__dirname, "fixtures/rpc.proto");

test("should create grpc service", async () => {
  const serviceOptions = <DeeRedis.ServiceOptions>{
    initialize: DeeRedis,
    args: {
      port: 6479
    } 
  };
  const app = await initApp(HANDLERS, { redis: serviceOptions });
  const srv = <DeeRedis.Service>app.srvs.redis;
  const result = await srv.ping()
  expect(result).toEqual('PONG');
  await srv.quit()
});

