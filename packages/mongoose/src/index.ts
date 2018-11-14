import * as Dee from "@sigodenjs/dee";
import * as mongoose from "mongoose";

export interface Service extends Dee.Service, mongoose.Mongoose {}

export interface Args extends Dee.Args {
  uris: string;
  options?: mongoose.ConnectionOptions;
}

export async function init(
  ctx: Dee.ServiceInitializeContext,
  args: Args
): Promise<Service> {
  const { uris, options: connectOptions } = args;
  await mongoose.connect(
    uris,
    connectOptions
  );
  return mongoose;
}
