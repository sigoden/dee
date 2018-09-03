import * as DeeMongoose from "../src";
import { initApp, HANDLERS } from "@sigodenjs/dee-test-utils";

test("should create grpc service", async () => {
  const serviceOptions = <DeeMongoose.ServiceOptions>{
    initialize: DeeMongoose,
    args: {
      uris: "mongodb://localhost:28017/test"
    }
  };
  const app = await initApp(HANDLERS, { mongo: serviceOptions });
  const srv = <DeeMongoose.Service>app.srvs.mongo;
  const res = await srv.connection.db.command({ping: 1});
  expect(res.ok).toBe(1);
  await srv.connection.close();
});
