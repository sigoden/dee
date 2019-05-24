import * as Dee from "@sigodenjs/dee";
import { Sequelize, Options, Model } from "sequelize";

interface ServiceExt<T> {
  getModel<TKey extends keyof T>(name: TKey): T[TKey];
  models: T;
}

export type Service<T> = Dee.Service & Sequelize & ServiceExt<T>;

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args {
  database: string;
  username: string;
  password: string;
  options?: Options;
}

export async function init<T>(ctx: Dee.ServiceInitializeContext, args: Args): Promise<Service<T>> {
  const { database, username, password, options: connectOptions } = args;
  const srv = new Sequelize(database, username, password, connectOptions);
  (srv as any).getModel = srv.model;
  await srv.authenticate();
  return srv as Service<T>;
}

export type ModelT<T> = { new (): T } & typeof Model;