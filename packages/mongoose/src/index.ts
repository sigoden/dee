import { SrvContext, IService, InitOutput } from "@sigodenjs/dee-srv";
import * as mongoose from "mongoose";

export type Service<T extends typeof mongoose> = IService & T;

export interface Args {
  uris: string;
  options?: mongoose.ConnectionOptions;
}

export async function init<T extends typeof mongoose>(ctx: SrvContext, args: Args): Promise<InitOutput<Service<T>>> {
  const { uris, options: connectOptions } = args;
  await mongoose.connect(uris, connectOptions);
  const stop = async () => {
    await mongoose.disconnect();
  }
  return { srv: mongoose as Service<T>, stop }
}
