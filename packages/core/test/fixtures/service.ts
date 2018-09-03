import { Service, ServiceOptions } from "../../src/index";

export interface SimpleService extends Service {}

export interface SimpleServiceOptions extends ServiceOptions {
  args: any;
}

export default async function initSimple(
  options: SimpleServiceOptions
): Promise<SimpleService> {
  const srv = {}
  return srv;
}

