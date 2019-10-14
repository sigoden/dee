import { SrvContext, ServiceBase, InitOutput } from "@sigodenjs/dee-srv";

export type Service<T> = ServiceBase & T;
export type Args = any;

export async function init<T, U>(ctx: SrvContext, args: U): Promise<InitOutput<Service<T>>> {
  const srv: any = args;
  return { srv: srv as Service<T> };
}
