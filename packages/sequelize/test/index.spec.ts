/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-interface */
import { Model, QueryTypes, Sequelize } from "sequelize";
import { createSrvLite } from "@sigodenjs/dee-srv-test-utils";
import * as DeeSequelize from "../src";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
class User extends Model {}
interface Models {
  User: User;
}

test("should create sequelize service", async () => {
  const { srv, stop } = await createSrvLite<DeeSequelize.Service<Sequelize, Models>, DeeSequelize.Args>("errs", {
    initialize: DeeSequelize.init,
    args: {
      database: "mysql",
      username: "root",
      password: "mysql",
      options: {
        port: 3306,
        dialect: "mysql",
        logging: false
      }
    }
  });
  const res = await srv.query("select 1", { type: QueryTypes.SELECT });
  expect(res).toEqual([{ 1: 1 }]);
  await stop();
});
