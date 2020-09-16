import * as IORedis from "ioredis";
import { SrvContext, ServiceBase, Ctor, INIT_KEY, STOP_KEY } from "@sigodenjs/dee-srv";

export type Service<T extends Redis> = T;

export interface Args extends IORedis.RedisOptions { };

export async function init<T extends Redis>(ctx: SrvContext, args: Args, ctor?: Ctor<T>): Promise<Service<T>> {
  const srv = new (ctor || Redis)(args);
  return new Promise<Service<T>>((resolve, reject) => {
    (srv as any).ctx = ctx;
    srv.once("connect", () => resolve(srv as Service<T>));
    srv.once("error", err => reject(err));
  });
}

export class Redis extends IORedis implements ServiceBase {
  public ctx: SrvContext;
  public [STOP_KEY]() {
    return this.disconnect();
  }
}
