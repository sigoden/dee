import * as Redis from "ioredis";
import { SrvContext, IService, InitOutput } from "@sigodenjs/dee-srv";

export type Service<T extends Redis.Redis> = IService & T;

export interface Args extends Redis.RedisOptions {};

export async function init<T extends Redis.Redis>(ctx: SrvContext, args: Args): Promise<InitOutput<Service<T>>> {
  const srv = new Redis(args);
  return new Promise<InitOutput<Service<T>>>((resolve, reject) => {
    srv.once("connect", () => resolve({ srv: srv as Service<T>, stop: srv.disconnect.bind(srv) }));
    srv.once("error", err => reject(err));
  });
}