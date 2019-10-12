import { SrvContext, IService, InitOutput } from "@sigodenjs/dee-srv";

export type Service<T> = IService & T;
export type Args<T> = () => Promise<T>;

export async function init<T, P>(ctx: SrvContext, args: Args<T>, deps: P): Promise<InitOutput<Service<T>>> {
  const srv = await args();
  return { srv: srv as Service<T> };
}
