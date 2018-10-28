import { HANDLERS, initApp } from "../../core/test-utils";
import * as DeeEcho from "../src";

test("should create echo service", async () => {
  const data = { k: "v" };
  const serviceOptions = <DeeEcho.ServiceOptions> {
    initialize: DeeEcho.init,
    args: data
  };
  const app = await initApp(HANDLERS, { echo: serviceOptions });
  const srv = <DeeEcho.Service<typeof data>> app.srvs.echo;
  expect(srv.data.k).toBe("v");
});
