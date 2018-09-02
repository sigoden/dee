import { Service, ServiceOptions } from "@sigodenjs/dee";
import * as Redis from "ioredis";

export interface IORedisService extends Service, Redis.Redis {}

export interface IORedisServiceOptions extends ServiceOptions {
  args: Redis.RedisOptions;
}

export default async function init(
  options: IORedisServiceOptions
): Promise<IORedisService> {
  const srv = new Redis(options.args);
  await srv.connect();
  return srv;
}
