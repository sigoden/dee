import * as Dee from "@sigodenjs/dee";

export interface Service<T> extends Dee.Service {
  data: T;
}

export interface ServiceOptions extends Dee.ServiceOptions {
  args: Args;
}

export interface Args extends Dee.Args {
  [k: string]: any;
}

export async function init<T extends Args>(
  ctx: Dee.ServiceInitializeContext,
  args: T
): Promise<Service<T>> {
  return { data: args };
}