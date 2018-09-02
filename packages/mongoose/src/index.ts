import { Service, ServiceOptions } from "@sigodenjs/dee";
import * as mongoose from "mongoose";

export interface MongooseService extends Service, mongoose.Mongoose {}

export interface MongooseServiceOptions extends ServiceOptions {
  args: MongooseArgs;
}

interface MongooseArgs {
  uris: string;
  options: mongoose.ConnectionOptions;
}

export default async function init(
  options: MongooseServiceOptions
): Promise<MongooseService> {
  const { uris, options: connectOptions } = options.args;
  return mongoose.connect(
    uris,
    connectOptions
  );
}
