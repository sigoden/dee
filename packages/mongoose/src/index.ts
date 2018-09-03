import * as Dee from "@sigodenjs/dee";
import * as mongoose from "mongoose";

declare namespace DeeMongoose {
  export interface Service extends Dee.Service, mongoose.Mongoose {}

  export interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  export interface Args {
    uris: string;
    options: mongoose.ConnectionOptions;
  }
}

async function DeeMongoose(
  options: DeeMongoose.ServiceOptions
): Promise<DeeMongoose.Service> {
  const { uris, options: connectOptions } = options.args;
  return mongoose.connect(
    uris,
    connectOptions
  );
}

export = DeeMongoose;
