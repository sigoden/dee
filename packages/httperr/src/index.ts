import * as Dee from "@sigodenjs/dee";
import template = require("lodash.template");

export type Service<T extends Args = {}> = Dee.Service & ErrorMapT<T>;

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export type ErrorMapT<T> = { [k in keyof T]: Factory };

export interface Args {
  [k: string]: ErrorParams;
}

export interface ErrorMap {
  [k: string]: Factory;
}

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
  private readonly args: CallArgs;
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
      return template(params.message)(args);
    };
  }
  public json(args: CallArgs) {
    return {
      code: this.code,
      message: this.createMessage(args),
      extra: (args && args.extra && args.extra.json) ? args.extra : undefined
    };
  }
  public resJSON(res: Dee.Response, args?: CallArgs) {
    res.status(this.status).json(this.json(args));
  }
  public toError(args?: CallArgs) {
    return new HttpErr(this.createMessage(args), this, args);
  }
}

export async function init(ctx: Dee.ServiceInitializeContext, args: Args): Promise<Service<Args>> {
  const srv = {} as Service<Args>;
  Object.keys(args).forEach(code => {
    srv[code] = new Factory(code, args[code]);
  });
  return srv;
}
