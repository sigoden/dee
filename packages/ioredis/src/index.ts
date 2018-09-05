import * as Dee from "@sigodenjs/dee";
import * as Redis from "ioredis";

export interface Service extends Dee.Service, Redis.Redis {}

export interface ServiceOptions extends Dee.ServiceOptions {
  args: Args;
}

export interface Args extends Dee.Args, Redis.RedisOptions {}

export async function init(
  ctx: Dee.ServiceInitializeContext,
  args: Args
): Promise<Service> {
  const srv = new Redis(args);
  return srv;
}
