import { HANDLERS, initApp } from "../../core/test-utils";
import * as DeeIORedis from "../src";

test("should create ioredis service", async () => {
  const serviceOptions = <DeeIORedis.ServiceOptions> {
    initialize: DeeIORedis.init,
    args: {
      port: 6479
    }
  };
  const app = await initApp(HANDLERS, { redis: serviceOptions });
  const srv = <DeeIORedis.Service> app.srvs.redis;
  const result = await srv.ping();
  expect(result).toEqual("PONG");
  await srv.quit();
});
