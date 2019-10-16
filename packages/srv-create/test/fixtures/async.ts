import { SrvContext, ServiceBase } from "@sigodenjs/dee-srv";

export type Service<T> = ServiceBase & T;
export type Args<T> = () => Promise<T>;

export async function init<T>(ctx: SrvContext, args: Args<T>): Promise<Service<T>> {
  await args();
  return {} as Service<T>;
}
