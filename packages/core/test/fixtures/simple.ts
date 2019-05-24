/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-interface */
import * as Dee from "../../src/index";

declare namespace DeeSimple {
  export interface Service extends Dee.Service {
    args: Args;
  }
  export interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  export interface Args {}
}

async function DeeSimple(ctx: Dee.ServiceInitializeContext, args: DeeSimple.Args): Promise<DeeSimple.Service> {
  const srv = { args };
  return srv;
}

export = DeeSimple;
