import * as Dee from "@sigodenjs/dee";
import * as template from "lodash.template";

declare global {
  namespace DeeShare { interface HttpErrMap {} }
}

export interface Service extends Dee.Service, ErrorMap {}

export interface ServiceOptions extends Dee.ServiceOptions {
  args: Args;
}

export interface Args extends Dee.Args {
  [k: string]: ErrorParams;
}

export interface ErrorMap extends DeeShare.HttpErrMap {
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

export class Factory {
  public status: number;
  private code: string;
  private createMessage: (args: CallArgs, withExtra?: boolean) => string;
  constructor(code: string, params: ErrorParams) {
    this.code = code;
    this.status = params.status;
    this.createMessage = (args: CallArgs, withExtra = false) => {
      let ret = template(params.message)(args);
      if (withExtra && args.extra) {
        ret += ` extra: ${args.extra}`;
      }
      return ret;
    };
  }
  public json(args: CallArgs) {
    return {
      code: this.code,
      message: this.createMessage(args),
      extra: args && args.extra ? args.extra : undefined
    };
  }
  public resJSON(res: Dee.Response, args?: CallArgs) {
    res.status(this.status).json(this.json(args));
  }
  public toError(args?: CallArgs) {
    const err = new Error(this.createMessage(args, true));
    err.name = this.code;
    return err;
  }
}

export async function init(
  ctx: Dee.ServiceInitializeContext,
  args: Args
): Promise<Service> {
  const srv = {} as Service;
  Object.keys(args).forEach(code => {
    srv[code] = new Factory(code, args[code]);
  });
  return srv;
}
