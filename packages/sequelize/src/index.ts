import * as Dee from "@sigodenjs/dee";
import { Sequelize, Options, Model } from "sequelize";

export interface Service<T> extends Dee.Service, Sequelize {
  getModel<TObject extends T, TKey extends keyof TObject>(name: TKey): TObject[TKey];
}

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args extends Dee.Args {
  database: string;
  username: string;
  password: string;
  options?: Options;
}

export async function init<T = {[key: string]: Model}>(
  ctx: Dee.ServiceInitializeContext,
  args: Args
): Promise<Service<T>> {
  const { database, username, password, options: connectOptions } = args;
  const srv = new Sequelize(database, username, password, connectOptions);
  await srv.authenticate();
  return Object.assign(srv, {
    getModel<TObject extends T, TKey extends keyof TObject>(name: TKey): TObject[TKey] {
      return (srv.models as any)[name];
    }
  });
}