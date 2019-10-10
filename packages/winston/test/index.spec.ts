import { HANDLERS, initApp } from "@sigodenjs/dee-test-utils";
import * as DeeWinston from "../src";

test("should create winston service", async () => {
  const serviceOptions = <DeeWinston.ServiceOptions>{
    initialize: DeeWinston.init,
    args: {
    }
  };
  const app = await initApp(HANDLERS, { winston: serviceOptions });
  const srv = <DeeWinston.Service<any>>app.srvs.winston;
  srv.info("hello");
  expect(srv.error).toBeDefined();
});
