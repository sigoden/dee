import { createSrvLite } from "@sigodenjs/dee-srv-test-utils";
import * as DeeMongoose from "../src";
import * as mongoose from "mongoose";

test("should create mongoose service", async () => {
  const { srv, stop } = await createSrvLite<DeeMongoose.Service<typeof mongoose>, DeeMongoose.Args>("mongo", {
    initialize: DeeMongoose.init,
    args: {
      uris: "mongodb://localhost:28017/test",
      options: {
        useNewUrlParser: true
      }
    }
  });
  const res = await srv.connection.db.command({ ping: 1 });
  expect(res.ok).toBe(1);
  await stop();
});
