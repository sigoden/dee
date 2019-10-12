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
    return new Promise<Stop>((resolve, reject) => {
      let deps = options.deps || [];
      deps = deps.slice();
      const createSrvWrap = () => {
        if (deps.length === 0) {
          createSrv(ctx, srvName, options)
            .then(o => {
              event.emit("ready", srvName);
              resolve(o.stop);
            }).catch(reject);
        }
      }
      if (deps.length === 0) {
        createSrvWrap();
        return;
      }
      deps.forEach(v => {
        if (!services[v]) {
          return reject(new ServiceCreateError(`service<${srvName}> need dependency ${v}, but not found`));
        }
      })
      event.on("ready", name => {
        const index = deps.findIndex(v => v === name);
        if (index > -1) deps.splice(index, 1);
        createSrvWrap();
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
    let deps; 
    if (init.deps && init.deps.length > 0) {
      if (!options.deps || init.deps.length !== options.deps.length) {
        throw new ServiceCreateError(`service<${srvName}> miss dependency, need ${JSON.stringify(init.deps)}, got ${JSON.stringify(options.deps)}`);
      }
      deps = init.deps.reduce((a, c, i) => {
        a[c] = ctx.srvs[options.deps[i]];
        return a;
      }, {})
    }
    const { srv, stop } = await init(ctx, options.args, deps);
    debug(`finish starting srv ${srvName}`);
    ctx.srvs[srvName] = srv;
    return { srv, stop: stop || (() => { }) }
  } catch (err) {
    throw new ServiceCreateError(`service<${srvName}> fail to init, ${err.message}`);
  }
}

export class ServiceCreateError extends Error { }