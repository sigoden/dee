import * as Dee from "../../src/index";

declare namespace DeeSimple {
  export interface Service extends Dee.Service {
    args: any;
  }

  export interface ServiceOptions extends Dee.ServiceOptions {
    args: any;
  }
}

async function DeeSimple(
  options: DeeSimple.ServiceOptions
): Promise<DeeSimple.Service> {
  const srv = { args: options.args };
  return srv;
}

export = DeeSimple;
