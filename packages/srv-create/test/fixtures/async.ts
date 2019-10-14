import { SrvContext, ServiceBase, InitOutput } from "@sigodenjs/dee-srv";

export type Service<T> = ServiceBase & T;
export type Args<T> = () => Promise<T>;

export async function init<T>(ctx: SrvContext, args: Args<T>): Promise<InitOutput<Service<T>>> {
  await args();
  return { srv: {} as Service<T> };
}
