import * as Dee from "@sigodenjs/dee";
import * as Redis from "ioredis";

const SEP = ":";

interface ServiceExt {
  deeSep: string;
  deeKey(...names: string[]): string;
}

export type Service<T> = Dee.Service & Redis.Redis & ServiceExt & T;

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args extends Redis.RedisOptions {
  sep?: string;
}

export async function init<T>(ctx: Dee.ServiceInitializeContext, args: Args): Promise<Service<T>> {
  const sep = args ? (args.sep ? args.sep : SEP) : SEP;
  const srv = Object.assign(new Redis(args), {
    deeSep: sep,
    deeKey: (...names: string[]) => {
      return [ctx.srvs.$config.name, ...names].join(srv.deeSep);
    }
  });
  return new Promise<Service<T>>((resolve, reject) => {
    srv.once("connect", () => resolve(srv as Service<T>));
    srv.once("error", err => reject(err));
  });
}
