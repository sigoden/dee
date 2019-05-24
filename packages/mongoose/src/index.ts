import * as Dee from "@sigodenjs/dee";
import * as mongoose from "mongoose";

export type Service<T> = Dee.Service & mongoose.Mongoose & T;

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args {
  uris: string;
  options?: mongoose.ConnectionOptions;
}

export async function init<T>(ctx: Dee.ServiceInitializeContext, args: Args): Promise<Service<T>> {
  const { uris, options: connectOptions } = args;
  await mongoose.connect(uris, connectOptions);
  return mongoose as Service<T>;
}
