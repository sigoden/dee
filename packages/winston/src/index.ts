import * as winston from "winston";
import { MESSAGE } from 'triple-beam';
import { dump } from "js-yaml";
import { isPlainObject } from "lodash";
import { SrvContext, IService, InitOutput, BaseConfig } from "@sigodenjs/dee-srv";

export type Service<T extends Logger> = IService & T;

export interface Args {
  noConsole?: boolean;
  file?: winston.transports.FileTransportOptions;
  http?: winston.transports.HttpTransportOptions;
}

const myFormat = winston.format((info, opts = {}) => {
  const { level, message } = info;
  let messgaeObj: any = {};
  if (typeof message === "string") {
    messgaeObj.message = message;
  } else {
    messgaeObj = message;
  }
  Object.assign(info, { level, timestamp: new Date().toISOString(), ...messgaeObj }, opts);
  return info;
});

const myConsoleFormat = winston.format((info, opts) => {
  const data = { ...info, ...opts, timestamp: new Date().toISOString() };
  info[MESSAGE] = dump({
    [info.level]: data,
  });
  return info;
});

export class Logger {
  private loggers?: winston.Logger[];
  constructor(config: BaseConfig, args: Args) {
    const { json, combine } = winston.format;
    const commonProps =  { service: [config.ns, config.name].join('.') };
    this.loggers = [];
    if (!args.noConsole) {
      this.loggers.push(winston.createLogger({
        format: myConsoleFormat(commonProps),
        transports: [new winston.transports.Console()],
      }));
    }
    if (args.http || args.file) {
      const transports = [];
      if (args.http) {
        transports.push(new winston.transports.Http(args.http));
      }
      if (args.file) {
        transports.push(new winston.transports.File(args.file));
      }
      this.loggers.push(winston.createLogger({
        format: combine(myFormat(commonProps), json()),
        transports,
      }));
    }
  }
  public info(message: string, extra: any = {}): void {
    const data = { message, ...extraToObj(extra) };
    this.loggers.forEach(logger => logger.info(data));
  }
  public debug(message: string, extra: any = {}): void {
    const data = { message, ...extraToObj(extra) };
    this.loggers.forEach(logger => logger.debug(data));
  }
  public warn(message: string, extra: any = {}): void {
    const data = { message, ...extraToObj(extra) };
    this.loggers.forEach(logger => logger.warn(data));
  }
  public error(message: Error | string, extra: any = {}): void {
    const data = { ...messageToObj(message), ...extraToObj(extra) };
    this.loggers.forEach(logger => logger.error(data));
  }
}

export async function init<T extends Logger>(ctx: SrvContext, args: Args): Promise<InitOutput<Service<T>>> {
  const logger = new Logger(ctx.config, args);
  return { srv: logger as Service<T> };
}

function messageToObj(message: Error | string) {
  if (message instanceof Error) {
    return { message: message.message, stack: message.stack, class: message.name };
  }
  return { message };
}
function extraToObj(extra: any) {
  return isPlainObject(extra) ? extra : { extra };
}