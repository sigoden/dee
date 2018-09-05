import * as Dee from "@sigodenjs/dee";
import * as mongoose from "mongoose";

declare namespace DeeMongoose {
  interface Service extends Dee.Service, mongoose.Mongoose {}

  interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  interface Args extends Dee.Args {
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
