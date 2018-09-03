import * as Dee from "@sigodenjs/dee";
import * as Sequelize from "sequelize";

declare namespace DeeSequelize {
  export interface Service extends Dee.Service, Sequelize.Sequelize {}

  export interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  export interface Args {
    database: string;
    username: string;
    password: string;
    options?: Sequelize.Options;
  }
}

async function DeeSequelize(
  options: DeeSequelize.ServiceOptions
): Promise<DeeSequelize.Service> {
  const {
    database,
    username,
    password,
    options: connectOptions
  } = options.args;
  const srv = new Sequelize(database, username, password, connectOptions);
  await srv.authenticate();
  return srv;
}


export = DeeSequelize;