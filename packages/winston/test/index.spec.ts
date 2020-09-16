import { createSrvLite } from "@sigodenjs/dee-srv-test-utils";
import * as DeeWinston from "../src";

test("should create winston service", async () => {
  const srv = await createSrvLite<DeeWinston.Service<DeeWinston.Logger>, DeeWinston.Args>("logger", {
    initialize: DeeWinston.init,
    args: {
    },
  });
  expect(srv.info).toBeDefined();
  expect(srv.error).toBeDefined();
  expect(srv.warn).toBeDefined();
  expect(srv.debug).toBeDefined();
});
