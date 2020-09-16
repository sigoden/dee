import { createSrvLite } from "@sigodenjs/dee-srv-test-utils";
import { STOP_KEY } from "@sigodenjs/dee-srv";
import * as DeeIORedis from "../src";

test("should create ioredis service", async () => {
  const srv = await createSrvLite<DeeIORedis.Service<DeeIORedis.Redis>, DeeIORedis.Args>("errs", {
    initialize: DeeIORedis.init,
    args: {
      port: 6379,
    },
  });
  const result = await srv.ping();
  expect(result).toEqual("PONG");
  await srv[STOP_KEY]();
});
