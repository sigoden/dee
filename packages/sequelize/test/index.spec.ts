/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-interface */
import { Model, QueryTypes } from "sequelize";
import { STOP_KEY, INIT_KEY } from "@sigodenjs/dee-srv";
import { createSrvLite } from "@sigodenjs/dee-srv-test-utils";
import * as DeeSequelize from "../src";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
class User extends Model { }
const ModelMap = {
  User: User,
};


test("should create sequelize service", async () => {
  const srv = await createSrvLite<DeeSequelize.Service<DeeSequelize.Sequelize<typeof ModelMap>, typeof ModelMap>, DeeSequelize.Args<typeof ModelMap>>("errs", {
    initialize: DeeSequelize.init,
    args: {
      database: "mysql",
      username: "root",
      password: "mysql",
      models: ModelMap,
      options: {
        port: 3306,
        dialect: "mysql",
        logging: false,
      },
    },
  });
  const res = await srv.query("select 1", { type: QueryTypes.SELECT });
  expect(res).toEqual([{ 1: 1 }]);
  await srv[STOP_KEY]();
});
