import * as DeeEcho from "../src";
import { initApp, HANDLERS } from "../../core/test-utils";

test("should create echo service", async () => {
  const data = { k: "v" };
  const serviceOptions = <DeeEcho.ServiceOptions>{
    initialize: DeeEcho.init,
    args: data
  };
  const app = await initApp(HANDLERS, { echo: serviceOptions });
  const srv = <DeeEcho.Service<typeof data>>app.srvs.echo;
  expect(srv.data.k).toBe("v");
});
