import * as Dee from "@sigodenjs/dee";
import { Sequelize, Options } from "sequelize";

export interface Service extends Dee.Service, Sequelize {}

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args extends Dee.Args {
  database: string;
  username: string;
  password: string;
  options?: Options;
}

export async function init(
  ctx: Dee.ServiceInitializeContext,
  args: Args
): Promise<Service> {
  const { database, username, password, options: connectOptions } = args;
  const srv = new Sequelize(database, username, password, connectOptions);
  await srv.authenticate();
  return srv;
}
