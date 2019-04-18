import { HANDLERS, initApp } from "../../core/test-utils";
import * as DeeSequelize from "../src";
import { QueryTypes } from "sequelize";

test("should create sequelize service", async () => {
  const serviceOptions = <DeeSequelize.ServiceOptions> {
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
  const srv = <DeeSequelize.Service> app.srvs.sequelize;
  const res = await srv.query("select 1", { type: QueryTypes.SELECT });
  expect(res).toEqual([{ 1: 1 }]);
  await srv.close();
});
