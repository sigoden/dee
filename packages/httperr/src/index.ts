import * as Dee from "@sigodenjs/dee";
import { SrvContext, ServiceBase, InitOutput } from "@sigodenjs/dee-srv";
import template = require("lodash.template");

export type Service<T> = ServiceBase & ErrorMap<T>;

export interface Args {
  [k: string]: ErrorParams;
}

export async function init(ctx: SrvContext, args: Args): Promise<InitOutput<Service<Args>>> {
  const srv = {};
  Object.keys(args).forEach(code => {
    srv[code] = new Factory(code, args[code]);
  });
  return { srv, stop: () => {} };
}

export type ErrorMap<T> = { [k in keyof T]: Factory };

export interface ErrorParams {
  message: string;
  status: number;
}

export interface CallArgs {
  [k: string]: any;
  // extra info return
  extra?: any;
}

export class HttpErr extends Error {
  public readonly status: number;
  public readonly args: CallArgs;
  private readonly factory: Factory;
  constructor(msg: string, f: Factory, args: CallArgs) {
    super(msg);
    this.factory = f;
    this.name = f.code;
    this.status = f.status;
    this.args = args;
  }

  public resJSON(res: Dee.Response) {
    return this.factory.resJSON(res, this.args);
  }
}

export class Factory {
  public readonly status: number;
  public readonly code: string;
  private createMessage: (args: CallArgs) => string;
  constructor(code: string, params: ErrorParams) {
    this.code = code;
    this.status = params.status;
    this.createMessage = (args: CallArgs) => {
      try {
        return template(params.message)(args);
      } catch (err) {
        return `cannot complete template<${params.message}> with args<${JSON.stringify(args)}>`;
      }
    };
  }
  public json(args: CallArgs) {
    return {
      code: this.code,
      message: this.createMessage(args),
      extra: (args && args.extra) ? args.extra : undefined,
    };
  }
  public resJSON(res: Dee.Response, args?: CallArgs) {
    res.status(this.status).json(this.json(args));
  }
  public toError(args?: CallArgs) {
    return new HttpErr(this.createMessage(args), this, args);
  }
}
