import * as Dee from "@sigodenjs/dee";
import * as template from "lodash.template";

declare global {
  namespace DeeHttpErr { interface ErrorMap {} }
}

declare namespace DeeHttpErr {
  export interface Service extends Dee.Service, ErrorMap {}

  export interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  export interface Args extends Dee.Args {
    [k: string]: ErrorParams;
  }

  export interface ErrorMap {
    [k: string]: DeeHttpErrFactory;
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
}

class DeeHttpErrFactory {
  public status: number;
  private code: string;
  private createMessage: (
    args: DeeHttpErr.CallArgs,
    withExtra?: boolean
  ) => string;
  constructor(code: string, params: DeeHttpErr.ErrorParams) {
    this.code = code;
    this.status = params.status;
    this.createMessage = (args: DeeHttpErr.CallArgs, withExtra = false) => {
      let ret = template(params.message)(args);
      if (withExtra && args.extra) {
        ret += ` extra: ${args.extra}`;
      }
      return ret;
    };
  }
  public json(args: DeeHttpErr.CallArgs) {
    return {
      code: this.code,
      message: this.createMessage(args),
      extra: args && args.extra ? args.extra : undefined
    };
  }
  public resJSON(res: Dee.Response, args?: DeeHttpErr.CallArgs) {
    res.status(this.status).json(this.json(args));
  }
  public toError(args?: DeeHttpErr.CallArgs) {
    let err = new Error(this.createMessage(args, true));
    err.name = this.code;
    return err;
  }
}

async function DeeHttpErr(
  ctx: Dee.ServiceInitializeContext,
  args: DeeHttpErr.Args
): Promise<DeeHttpErr.Service> {
  let srv = <DeeHttpErr.Service>{};
  Object.keys(args).forEach(code => {
    srv[code] = new DeeHttpErrFactory(code, args[code]);
  });
  return srv;
}

export = DeeHttpErr;