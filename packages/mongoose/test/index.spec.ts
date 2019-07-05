import { HANDLERS, initApp } from "@sigodenjs/dee-test-utils";
import * as DeeMongoose from "../src";

test("should create mongoose service", async () => {
  const serviceOptions = <DeeMongoose.ServiceOptions>{
    initialize: DeeMongoose.init,
    args: {
      uris: "mongodb://localhost:28017/test",
      options: {
        useNewUrlParser: true
      }
    }
  };
  const app = await initApp(HANDLERS, { mongo: serviceOptions });
  const srv = <DeeMongoose.Service<any>>app.srvs.mongo;
  const res = await srv.connection.db.command({ ping: 1 });
  expect(res.ok).toBe(1);
  await srv.connection.close();
});
