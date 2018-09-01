import * as winston from "winston";
import { Service, ServiceOptions } from "@sigodenjs/dee";

export interface WinstonService extends Service, winston.Logger {}

export interface WinstonServiceOptions extends ServiceOptions {
  args: WinstonArgs;
}

interface WinstonArgs {
  level?: string;
  format?: string;
  transporters?: TransporterMap;
}

interface TransporterMap {
  [k: string]: any;
}

export default async function init(
  options: WinstonServiceOptions
): Promise<WinstonService> {
  let {
    transporters = { Console: {} },
    format = "simple",
    level = "warning"
  } = options.args;
  let transports = [];
  let unsupportTransportNames = [];
  for (let name in transporters) {
    const Transporter = winston.transports[name];
    if (!Transporter) {
      unsupportTransportNames.push(name);
      continue;
    }
    const transportOptions = transporters[name];
    transporters.push(new Transporter(transportOptions));
  }
  if (unsupportTransportNames.length > 0) {
    throw new Error(
      "transporter " + unsupportTransportNames.join(",") + " is not supported"
    );
  }
  if (!winston.format[format]) {
    throw new Error("format " + format + " is not supported");
  }

  return winston.createLogger({
    level,
    format: winston.format[format],
    transports
  });
}
