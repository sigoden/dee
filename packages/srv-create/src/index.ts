import { SrvContext, InitFn, Stop } from "@sigodenjs/dee-srv";
import * as createDebug from "debug";
import { EventEmitter } from "events";

const debug = createDebug('service');

export type ServiceOptionMap = {
  [k: string]: ServiceOption<any>;
};

export interface ServiceOption<U> {
  initialize: InitFn<any, U, any> | string;
  args: U;
  deps?: string[];
}

export interface CreateSrvOutput<T> {
  srv: T;
  stop: Stop;
}

export async function createSrvs(ctx: SrvContext, services: ServiceOptionMap = {}): Promise<Stop[]> {
  const event = new EventEmitter();
  const stops = await Promise.all(Object.keys(services).map(srvName => {
    const options = services[srvName];
    if (!options.deps || options.deps.length === 0) {
      return createSrv(ctx, srvName, options).then(o => {
        event.emit("ready", srvName);
        return o.stop;
      });
    }
    if (!options.deps.every(v => !!services[v])) {
      throw new ServiceCreateError(`service<${srvName}> have invalid dependecies`);
    }
    const deps = options.deps.slice();
    return new Promise<Stop>((resolve, reject) => {
      event.on("ready", name => {
        const index = deps.findIndex(v => v === name);
        if (index > -1) deps.splice(index, 1);
        if (deps.length === 0) {
          createSrv(ctx, srvName, options)
            .then(o => {
              event.emit("ready", srvName);
              resolve(o.stop);
            }).catch(reject);
        }
      });
    });
  }));
  event.removeAllListeners();
  return stops;
}

export async function createSrv<T, U>(ctx: SrvContext, srvName: string, options: ServiceOption<U>): Promise<CreateSrvOutput<T>> {
  debug(`starting srv ${srvName}`);
  try {
    let init: InitFn<T, U, any>;
    if (typeof options.initialize === "string") {
      init = require(options.initialize).init;
    } else {
      init = options.initialize;
    }
    const { srv, stop } = await init(ctx, options.args);
    debug(`finish starting srv ${srvName}`);
    ctx.srvs[srvName] = srv;
    return { srv, stop: stop || (() => { }) }
  } catch (err) {
    throw new ServiceCreateError(`service<${srvName}> fail to init, ${err.message}`);
  }
}

export class ServiceCreateError extends Error { }