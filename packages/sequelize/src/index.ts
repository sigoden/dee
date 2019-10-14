import { Sequelize, Options, Model } from "sequelize";
import { SrvContext, ServiceBase, Ctor, InitOutput } from "@sigodenjs/dee-srv";


export type Service<T extends Sequelize, U> = ServiceBase & T & {
  model<TKey extends keyof U>(name: TKey): U[TKey];
  models: U;
};

export interface Args {
  database: string;
  username: string;
  password: string;
  options?: Options;
}


export async function init<T extends Sequelize, U>(ctx: SrvContext, args: Args, ctor?: Ctor<T>): Promise<InitOutput<Service<T, U>>> {
  const { database, username, password, options: connectOptions } = args;
  const srv = new (ctor || Sequelize)(database, username, password, connectOptions);
  await srv.authenticate();
  const stop = () => {
    srv.close();
  };
  return { srv: srv as Service<T, U>, stop };
}

export type ModelT<T> = { new (): T } & typeof Model;
