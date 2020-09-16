import { SrvContext, ServiceBase } from "@sigodenjs/dee-srv";

export type Service<T> = ServiceBase & T;
export type Args<T> = (deps: any) => Promise<T>;

export async function init<T, U, P>(ctx: SrvContext, args: Args<T>, ctor?: U, deps?: P): Promise<Service<T>> {
  await args(deps);
  return {} as Service<T>;
}

init.deps = ["asy"];
