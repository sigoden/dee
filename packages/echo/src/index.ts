import { SrvContext, ServiceBase } from "@sigodenjs/dee-srv";

export type Service<T> = ServiceBase & T;
export type Args = any;

export async function init<T, U>(ctx: SrvContext, args: U): Promise<Service<T>> {
  const srv = args as any;
  return srv as Service<T>;
}
