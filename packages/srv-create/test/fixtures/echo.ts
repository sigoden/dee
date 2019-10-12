import { SrvContext, IService, InitOutput } from "@sigodenjs/dee-srv";

export type Service<T> = IService & T;
export type Args = any;

export async function init<T, U, P>(ctx: SrvContext, args: U, deps: P): Promise<InitOutput<Service<T>>> {
  const srv: any = args;
  return { srv: srv as Service<T> };
}

