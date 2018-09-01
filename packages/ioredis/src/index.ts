import * as Redis from "ioredis";
import { Service, ServiceOptions } from "@sigodenjs/dee";

export interface IORedisService extends Service, Redis.Redis {}

export interface IORedisServiceOptions extends ServiceOptions {
  args: Redis.RedisOptions;
}

export default async function init(
  options: IORedisServiceOptions
): Promise<IORedisService> {
  let srv = new Redis(options.args);
  await srv.connect();
  return srv;
}
