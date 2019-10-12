import { SrvContext, IService, InitOutput } from "@sigodenjs/dee-srv";

export type Service<T> = IService & T;
export type Args<T> = () => Promise<T>;

export async function init<T>(ctx: SrvContext, args: Args<T>): Promise<InitOutput<Service<T>>> {
  const srv = await args();
  return { srv: srv as Service<T> };
}
