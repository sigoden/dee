import { SrvContext, ServiceBase, InitOutput } from "@sigodenjs/dee-srv";
import * as mongoose from "mongoose";

export type Service<T extends mongoose.Mongoose> = ServiceBase & T;

export interface Args {
  uris: string;
  options?: mongoose.ConnectionOptions;
}

export async function init<T extends mongoose.Mongoose>(ctx: SrvContext, args: Args): Promise<InitOutput<Service<T>>> {
  const { uris, options: connectOptions } = args;
  await mongoose.connect(uris, connectOptions);
  const stop = async () => {
    await mongoose.disconnect();
  };
  const srv = mongoose as Service<T>;
  (srv as any).ctx = ctx;
  return { srv: srv, stop };
}

export interface Mongoose extends mongoose.Mongoose {
  ctx: SrvContext;
}
