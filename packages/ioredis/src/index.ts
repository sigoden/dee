import * as IORedis from "ioredis";
import { SrvContext, IService, InitOutput } from "@sigodenjs/dee-srv";

export type Service<T extends IORedis.Redis> = IService & T;

export interface Args extends IORedis.RedisOptions {};

export async function init<T extends Redis>(ctx: SrvContext, args: Args, ctor?: { new(): T }): Promise<InitOutput<Service<T>>> {
  const srv = new (ctor || IORedis)(args);
  return new Promise<InitOutput<Service<T>>>((resolve, reject) => {
    (srv as any).ctx = ctx;
    srv.once("connect", () => resolve({ srv: srv as Service<T>, stop: srv.disconnect.bind(srv) }));
    srv.once("error", err => reject(err));
  });
}

export class Redis extends IORedis {
  public ctx: SrvContext;
}