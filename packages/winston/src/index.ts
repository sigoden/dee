import * as Dee from "@sigodenjs/dee";
import * as winston from "winston";

declare namespace DeeWinston {
  export interface Service extends Dee.Service, winston.Logger {}

  export interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  export interface Args {
    level?: string;
    format?: string;
    transporters?: TransporterMap;
  }

  export interface TransporterMap {
    [k: string]: any;
  }
}

async function DeeWinston(
  options: DeeWinston.ServiceOptions
): Promise<DeeWinston.Service> {
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

export = DeeWinston;
