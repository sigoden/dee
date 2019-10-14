import { SrvContext, IService, InitOutput } from "@sigodenjs/dee-srv";

export type Service<T> = IService & T;
export type Args<T> = () => Promise<T>;

export async function init<T>(ctx: SrvContext, args: Args<T>): Promise<InitOutput<Service<T>>> {
  await args();
  return { srv: {} as Service<T> };
}
