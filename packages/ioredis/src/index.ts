import * as Dee from "@sigodenjs/dee";
import * as Redis from "ioredis";

declare namespace DeeIORedis {
  export interface Service extends Dee.Service, Redis.Redis {}

  export interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  export interface Args extends Dee.Args, Redis.RedisOptions {}
}

async function DeeIORedis(
  ctx: Dee.ServiceInitializeContext,
  args: DeeIORedis.Args
): Promise<DeeIORedis.Service> {
  const srv = new Redis(args);
  return srv;
}

export = DeeIORedis;
