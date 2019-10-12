import { createSrvLite } from "@sigodenjs/dee-srv-test-utils";
import * as Redis from "ioredis";
import * as DeeIORedis from "../src";

test("should create ioredis service", async () => {
  const { srv, stop } = await createSrvLite<DeeIORedis.Service<Redis.Redis>, DeeIORedis.Args>("errs", {
    initialize: DeeIORedis.init,
    args: {
      port: 6479
    }
  });
  const result = await srv.ping();
  expect(result).toEqual("PONG");
  await stop();
});
