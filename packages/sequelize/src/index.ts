import { Service, ServiceOptions } from "@sigodenjs/dee";
import * as Sequelize from "sequelize";

export interface SequelizeService extends Service, Sequelize.Sequelize {}

export interface SequelizeServiceOptions extends ServiceOptions {
  args: SequelizeArgs;
}

interface SequelizeArgs {
  database: string;
  username: string;
  password: string;
  options?: Sequelize.Options;
}

export default async function init(
  options: SequelizeServiceOptions
): Promise<SequelizeService> {
  const { database, username, password, options: connectOptions } = options.args;
  const srv = new Sequelize(database, username, password, connectOptions);
  await srv.authenticate();
  return srv;
}
