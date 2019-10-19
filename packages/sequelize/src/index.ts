import { Sequelize as Sequelize_, Options, Model, ModelCtor } from "sequelize";
import { SrvContext, ServiceBase, Ctor, STOP_KEY, INIT_KEY } from "@sigodenjs/dee-srv";


export type Service<T extends Sequelize<U>, U extends ModelMap> =  T;

export interface Args<U> {
  database: string;
  username: string;
  password: string;
  models: U;
  options?: Options;
}


export async function init<T extends Sequelize<U>, U extends ModelMap>(ctx: SrvContext, args: Args<U>, ctor?: Ctor<T>): Promise<Service<T, U>> {
  const { database, username, password, options: connectOptions } = args;
  const srv = new (ctor || Sequelize)(database, username, password, connectOptions);
  srv.args = args;
  srv.ctx = ctx;
  return srv as Service<T, U>;
}

export interface ModelMap {
  [k: string]: ModelCtor<Model<any, any>>;
}

export const LOAD_MODELS = Symbol("loadModel");

export class Sequelize<U extends ModelMap> extends Sequelize_ implements ServiceBase {
  public ctx: SrvContext;
  public args: Args<U>;
  public models: U;
  public async [INIT_KEY]() {
    await this.authenticate();
    await this[LOAD_MODELS]();
  }

  public model<TKey extends keyof U>(name: TKey): U[TKey] {
    return super.model(name as any) as any;
  }
  public async [LOAD_MODELS]() {
    for (const key in this.args.models) {
      const model = this.args.models[key] as any;
      await model.bootstrap(this);
      model.srvs = this.ctx.srvs;
      if (!this.models[key]) {
        (this.models as any)[key] = model;
      }
    }
    for (const key in this.args.models) {
      const model = this.args.models[key] as any;
      if (model["associate"]) model["associate"]();
    }
  }
  public [STOP_KEY]() {
    return this.close();
  }
}
