/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-interface */
import { HANDLERS, initApp } from "@sigodenjs/dee-test-utils";
import { Model } from "sequelize";
import * as DeeSequelize from "../src";
import { QueryTypes } from "sequelize";

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
class User extends Model {}
interface Models {
  User: User;
}

test("should create sequelize service", async () => {
  const serviceOptions = <DeeSequelize.ServiceOptions>{
    initialize: DeeSequelize.init,
    args: {
      database: "mysql",
      username: "root",
      password: "mysql",
      options: {
        port: 3406,
        dialect: "mysql",
        logging: false
      }
    }
  };
  const app = await initApp(HANDLERS, { sequelize: serviceOptions });
  const srv = <DeeSequelize.Service<Models>>app.srvs.sequelize;
  const res = await srv.query("select 1", { type: QueryTypes.SELECT });
  expect(res).toEqual([{ 1: 1 }]);
  await srv.close();
});
