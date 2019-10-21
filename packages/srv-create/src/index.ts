import { SrvContext, InitFn, Ctor, INIT_KEY, READY_KEY } from "@sigodenjs/dee-srv";
import * as createDebug from "debug";
import { EventEmitter } from "events";

const debug = createDebug("dee-srv");

export type ServiceOptionMap = {
  [k: string]: ServiceOption<any, any, any>;
};

export interface ServiceOption<T, U, C = Ctor<T>> {
  initialize: InitFn<any, U, any> | string;
  args: U;
  ctor?: C;
  deps?: string[];
}

export async function createSrvs(ctx: SrvContext, services: ServiceOptionMap = {}): Promise<void> {
  const event = new EventEmitter();
  await Promise.all(Object.keys(services).map(srvName => {
    const options = services[srvName];
    let deps = options.deps || [];
    deps = deps.slice();
    return new Promise<void>((resolve, reject) => {
      const createSrvWrap = () => {
        setTimeout(() => {
          createSrv(ctx, srvName, options)
            .then(() => {
              event.emit("ready", srvName);
              resolve();
            }).catch(err => {
              event.emit("error", err);
              reject(err);
            });
        }, 0);
      };
      if (deps.length === 0) {
        createSrvWrap();
        return;
      }
      deps.forEach(v => {
        if (!services[v]) {
          return reject(new ServiceCreateError(`service<${srvName}> need dependency ${v}, but not found`));
        }
      });
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
  await Promise.all(Object.keys(ctx.srvs).map(async srvName => {
    const srv = ctx.srvs[srvName];
    if (srv[INIT_KEY]) {
      debug(`running srv ${srvName}'s init`);
      await srv[INIT_KEY]();
      debug(`done srv ${srvName}'s init`);
    }
  }));
  await Promise.all(Object.keys(ctx.srvs).map(async srvName => {
    const srv = ctx.srvs[srvName];
    if (srv[READY_KEY]) {
      debug(`running srv ${srvName}'s ready`);
      await srv[READY_KEY]();
      debug(`done srv ${srvName}'s ready`);
    }
  }));
  event.removeAllListeners();
}

export async function createSrv<T, U>(ctx: SrvContext, srvName: string, options: ServiceOption<T, U>): Promise<T> {
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
      }, {});
    }
    const srv = await init(ctx, options.args, options.ctor, deps);
    debug(`finish starting srv ${srvName}`);
    ctx.srvs[srvName] = srv;
    return srv;
  } catch (err) {
    throw new ServiceCreateError(`service<${srvName}> fail to init, ${err.message}`);
  }
}

export class ServiceCreateError extends Error { }
