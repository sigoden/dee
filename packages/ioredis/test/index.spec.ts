import * as DeeIORedis from "../src";
import { initApp, HANDLERS } from "@sigodenjs/dee-test-utils";

test("should create ioredis service", async () => {
  const serviceOptions = <DeeIORedis.ServiceOptions>{
    initialize: DeeIORedis,
    args: {
      port: 6479
    } 
  };
  const app = await initApp(HANDLERS, { redis: serviceOptions });
  const srv = <DeeIORedis.Service>app.srvs.redis;
  const result = await srv.ping()
  expect(result).toEqual('PONG');
  await srv.quit()
});

