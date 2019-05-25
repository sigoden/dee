import * as Dee from "@sigodenjs/dee";
import * as Redis from "ioredis";


export type Service<T = {}> = Dee.Service & Redis.Redis & T;

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args extends Redis.RedisOptions {}

export async function init<T>(ctx: Dee.ServiceInitializeContext, args: Args): Promise<Service<T>> {
  const srv = new Redis(args);
  return new Promise<Service<T>>((resolve, reject) => {
    srv.once("connect", () => resolve(srv as Service<T>));
    srv.once("error", err => reject(err));
  });
}
