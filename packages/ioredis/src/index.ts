import * as Dee from "@sigodenjs/dee";
import * as Redis from "ioredis";

const SEP = ":";

export interface Service extends Dee.Service, Redis.Redis {
  deeSep: string;
  deeKey(...names: string[]): string
}

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args extends Dee.Args, Redis.RedisOptions {
  sep?: string
}

export async function init(
  ctx: Dee.ServiceInitializeContext,
  args: Args
): Promise<Service> {
  const sep = args ? (args.sep ? args.sep : SEP) : SEP;
  const srv = Object.assign(new Redis(args), {
    deeSep: sep,
    deeKey: (...names: string[]) => {
      return [ctx.srvs.$config.name, ...names].join(srv.deeSep);
    }
  });
  return new Promise<Service>((resolve, reject) => {
    srv.once("connect", () => resolve(srv));
    srv.once("error", err => reject(err));
  });
}