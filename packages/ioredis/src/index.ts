import * as Dee from "@sigodenjs/dee";
import * as Redis from "ioredis";

declare namespace DeeIORedis {
  export interface Service extends Dee.Service, Redis.Redis {}

  export interface ServiceOptions extends Dee.ServiceOptions {
    args: Redis.RedisOptions;
  }
}

async function DeeIORedis(
  options: DeeIORedis.ServiceOptions
): Promise<DeeIORedis.Service> {
  const srv = new Redis(options.args);
  await srv.connect();
  return srv;
}

export = DeeIORedis;
