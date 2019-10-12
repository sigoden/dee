import { createSrvLite } from "@sigodenjs/dee-srv-test-utils";
import * as DeeEcho from "../src";

test("should create echo service", async () => {
  const data = { k: "v" };
  const { srv } = await createSrvLite<DeeEcho.Service<typeof data>, DeeEcho.Args>("settings", {
    initialize: DeeEcho.init,
    args: data
  });
  expect(srv.k).toBe("v");
});
