import { SrvContext, InitFn, Stop } from "@sigodenjs/dee-srv";
import * as createDebug from "debug";
import { EventEmitter } from "events";

const debug = createDebug('dee-srv');

export type ServiceOptionMap = {
  [k: string]: ServiceOption<any, any>;
};

export interface ServiceOption<T, U> {
  initialize: InitFn<any, U, any> | string;
  args: U;
  ctor?: { new(): T };
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
    let deps = options.deps || [];
    deps = deps.slice();
    return new Promise<Stop>((resolve, reject) => {
      const createSrvWrap = () => {
        createSrv(ctx, srvName, options)
          .then(o => {
            ctx.srvs[srvName] = o.srv;
            event.emit("ready", srvName);
            resolve(o.stop);
          }).catch(err => {
            event.emit("error", err);
            reject(err);
          });
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
      event.on("error", err => reject(new ServiceCreateError(`service<${srvName}> abort, ${err}`)));
      event.on("ready", name => {
        if (ctx.srvs[srvName]) {
          return;
        }
        const index = deps.findIndex(v => v === name);
        if (index > -1) deps.splice(index, 1);
        if (deps.length === 0) {
          createSrvWrap();
        }
      });
    });
  }));
  event.removeAllListeners();
  return stops;
}

export async function createSrv<T, U>(ctx: SrvContext, srvName: string, options: ServiceOption<T, U>): Promise<CreateSrvOutput<T>> {
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
    const { srv, stop = (() => {}) } = await init(ctx, options.args, options.ctor, deps);
    debug(`finish starting srv ${srvName}`);
    return { srv, stop }
  } catch (err) {
    throw new ServiceCreateError(`service<${srvName}> fail to init, ${err.message}`);
  }
}

export class ServiceCreateError extends Error { }