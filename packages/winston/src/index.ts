import * as Dee from "@sigodenjs/dee";
import * as DeeHttpErr from "@sigodenjs/dee-httperr";
import * as winston from "winston";
import { MESSAGE } from 'triple-beam';
import { dump } from "js-yaml";
import { isPlainObject, omit } from "lodash";

export type Service<T = {}> = Dee.Service & Logger & T;

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args {
  noConsole?: boolean;
  file?: winston.transports.FileTransportOptions;
  http?: winston.transports.HttpTransportOptions;
}

const OMIT_HEADERS = [
  "accept",
  "accept-encoding",
  "accept-language",
  "cache-control",
  "connection ",
  "cookie",
  "host",
  "pragma",
  "referer",
  "user-agent",
]

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

class Logger {
  private loggers?: winston.Logger[];
  constructor(config: Dee.Config, args: Args) {
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
  public error(message: Error | string, extra: any = {}): void {
    const data = { ...messageToObj(message), ...extraToObj(extra) };
    this.loggers.forEach(logger => logger.error(data));
  }
  public errorHttp(message: Error | string, req: Dee.Request, extra: any = {}): void {
    const data = { ...messageToObj(message), ...reqToObj(req), ...extraToObj(extra) };
    this.loggers.forEach(logger => logger.error(data));
  }
}

export async function init<T>(ctx: Dee.ServiceInitializeContext, args: Args): Promise<Service<T>> {
  const logger = new Logger(ctx.srvs.$config, args);
  return Promise.resolve(logger as Service<T>);
}

function messageToObj(message: Error | string) {
  if (message instanceof Error) {
    if (message instanceof DeeHttpErr.HttpErr) {
      return { message: message.message, stack: message.stack, class: message.name, status: message.status, args: JSON.stringify(message.args) };
    }
    return { message: message.message, stack: message.stack, class: message.name };
  }
  return { message };
}
function extraToObj(extra: any) {
  return isPlainObject(extra) ? extra : { extra };
}
function reqToObj(req: Dee.Request) {
  const { url, body, auth, authM, params, query, headers } = req as any;
  const data: any = { url, body, params, query, headers: omit(headers, OMIT_HEADERS) }
  if (auth) {
    data.auth = auth;
  }
  if (authM) {
    data.authM = authM;
  }
  return data;
}
