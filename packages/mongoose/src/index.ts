import { SrvContext, ServiceBase, STOP_KEY } from "@sigodenjs/dee-srv";
import * as mongoose from "mongoose";

export type Service<T extends Mongoose> = T;

export interface Args {
  uris: string;
  options?: mongoose.ConnectionOptions;
}

export async function init<T extends Mongoose>(ctx: SrvContext, args: Args): Promise<Service<T>> {
  const { uris, options: connectOptions } = args;
  await mongoose.connect(uris, connectOptions);
  const srv = mongoose as Service<T>;
  srv[STOP_KEY] = () => mongoose.disconnect();
  (srv as any).ctx = ctx;
  return srv;
}

export interface Mongoose extends mongoose.Mongoose, ServiceBase {
  ctx: SrvContext;
}
