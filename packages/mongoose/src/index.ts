import * as mongoose from "mongoose";
import { Service, ServiceOptions } from "@sigodenjs/dee";

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
  let { uris, options: connectOptions } = options.args;
  return mongoose.connect(
    uris,
    connectOptions
  );
}