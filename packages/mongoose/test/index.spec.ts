import { createSrvLite } from "@sigodenjs/dee-srv-test-utils";
import { STOP_KEY } from "@sigodenjs/dee-srv";
import * as DeeMongoose from "../src";

test("should create mongoose service", async () => {
  const srv = await createSrvLite<DeeMongoose.Service<DeeMongoose.Mongoose>, DeeMongoose.Args>("mongo", {
    initialize: DeeMongoose.init,
    args: {
      uris: "mongodb://localhost:27017/test",
      options: {
        useNewUrlParser: true,
      },
    },
  });
  const res = await srv.connection.db.command({ ping: 1 });
  expect(res.ok).toBe(1);
  await srv[STOP_KEY]();
});
