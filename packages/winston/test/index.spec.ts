import { HANDLERS, initApp } from "../../core/test-utils";
import * as DeeWinston from "../src";

test("should create winston service", async () => {
  const serviceOptions = <DeeWinston.ServiceOptions> {
    initialize: DeeWinston.init,
    args: {
      format: "simple",
      level: "debug",
      transporters: {
        Console: {}
      }
    }
  };
  const app = await initApp(HANDLERS, { winston: serviceOptions });
  const srv = <DeeWinston.Service> app.srvs.winston;
  srv.debug("hello");
  expect(srv.log).toBeDefined();
});
