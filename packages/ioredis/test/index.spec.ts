import { createSrvLite } from "@sigodenjs/dee-srv-test-utils";
import * as IORedis from "ioredis";
import * as DeeIORedis from "../src";

test("should create ioredis service", async () => {
  const { srv, stop } = await createSrvLite<DeeIORedis.Service<IORedis.Redis>, DeeIORedis.Args>("errs", {
    initialize: DeeIORedis.init,
    args: {
      port: 6379
    }
  });
  const result = await srv.ping();
  expect(result).toEqual("PONG");
  await stop();
});
