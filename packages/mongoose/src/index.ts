import * as Dee from "@sigodenjs/dee";
import * as mongoose from "mongoose";

declare namespace DeeMongoose {
  export interface Service extends Dee.Service, mongoose.Mongoose {}

  export interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  export interface Args extends Dee.Args {
    uris: string;
    options?: mongoose.ConnectionOptions;
  }
}

async function DeeMongoose(
  ctx: Dee.ServiceInitializeContext,
  args: DeeMongoose.Args
): Promise<DeeMongoose.Service> {
  const { uris, options: connectOptions } = args;
  await mongoose.connect(
    uris,
    connectOptions
  );
  return mongoose;
}

export = DeeMongoose;
