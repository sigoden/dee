import * as Dee from "@sigodenjs/dee";

export type Service<T> = Dee.Service & T;

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args {
  [k: string]: any;
}

export async function init<T extends Args>(ctx: Dee.ServiceInitializeContext, args: T): Promise<Service<T>> {
  return args;
}
