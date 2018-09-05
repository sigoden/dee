import * as DeeWinston from "../src";
import { initApp, HANDLERS } from "../../core/test-utils";

test("should create winston service", async () => {
  const serviceOptions = <DeeWinston.ServiceOptions>{
    initialize: DeeWinston,
    args: {
      format: "simple",
      level: "debug",
      transporters: {
        Console: {}
      }
    }
  };
  const app = await initApp(HANDLERS, { winston: serviceOptions });
  const srv = <DeeWinston.Service>app.srvs.winston;
  srv.debug("hello");
  expect(srv.log).toBeDefined();
});
