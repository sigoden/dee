import { Service, ServiceOptions } from "@sigodenjs/dee";
import * as winston from "winston";

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
  const {
    format = "simple",
    level = "warning",
    transporters = { Console: {} }
  } = options.args;
  const transports = [];
  const unsupportTransportNames = [];
  Object.keys(transporters).forEach(name => {
    const Transporter = winston.transports[name];
    if (!Transporter) {
      unsupportTransportNames.push(name);
      return;
    }
    const transportOptions = transporters[name];
    transports.push(new Transporter(transportOptions));
  });
  if (unsupportTransportNames.length > 0) {
    throw new Error(
      "transporter " + unsupportTransportNames.join(",") + " is not supported"
    );
  }
  if (!winston.format[format]) {
    throw new Error("format " + format + " is not supported");
  }

  return winston.createLogger({
    format: winston.format[format],
    level,
    transports
  });
}
