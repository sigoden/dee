import { SrvContext, ServiceBase } from "@sigodenjs/dee-srv";

export type Service<T> = ServiceBase & T;
export type Args = any;

export async function init<T, U, P>(ctx: SrvContext, args: U): Promise<Service<T>> {
  const srv: any = args;
  return srv as Service<T>;
}

