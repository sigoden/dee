import * as Dee from "@sigodenjs/dee";
import * as winston from "winston";

export type Service<T> = Dee.Service & winston.Logger & T;

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args {
  level?: string;
  format?: string;
  transporters?: TransporterMap;
}

export interface TransporterMap {
  [k: string]: any;
}

export async function init<T>(ctx: Dee.ServiceInitializeContext, args: Args): Promise<Service<T>> {
  const { format = "simple", level = "warn", transporters = { Console: {} } } = args;
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
    throw new Error("transporter " + unsupportTransportNames.join(",") + " is not supported");
  }
  if (!winston.format[format]) {
    throw new Error("format " + format + " is not supported");
  }

  const ws = winston.createLogger({
    format: winston.format[format](),
    level,
    transports
  });
  return ws as Service<T>;
}
