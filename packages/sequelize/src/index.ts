import * as Dee from "@sigodenjs/dee";
import * as Sequelize from "sequelize";

declare namespace DeeSequelize {
  interface Service extends Dee.Service, Sequelize.Sequelize {}

  interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  interface Args extends Dee.Args {
    database: string;
    username: string;
    password: string;
    options?: Sequelize.Options;
  }
}

async function DeeSequelize(
  ctx: Dee.ServiceInitializeContext,
  args: DeeSequelize.Args
): Promise<DeeSequelize.Service> {
  const { database, username, password, options: connectOptions } = args;
  const srv = new Sequelize(database, username, password, connectOptions);
  await srv.authenticate();
  return srv;
}

export = DeeSequelize;
