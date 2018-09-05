import * as swaggerize from "@sigodenjs/dee-swaggerize";
import * as express from "express";
import * as expressCore from "express-serve-static-core";
import { Server } from "http";
import { tryWrapRequestHandler } from "./utils";

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 3000;

declare global {
  namespace DeeShare {
    interface ServiceGroup {}
  }
  namespace Express {
    interface Request {
      srvs: ServiceGroup;
    }
  }
}

export interface Request extends expressCore.Request {}
export interface Response extends expressCore.Response {}
export interface NextFunction extends expressCore.NextFunction {}
export interface RequestHandler extends expressCore.RequestHandler {}
export interface HandlerFuncMap extends swaggerize.HandlerFuncMap {}
export interface Express extends expressCore.Express {}

// options to init dee app
export interface Options {
  // general config
  config: Config;
  // options to init swaggerize service
  swaggerize: swaggerize.Options;
  // hook to run before bind route handlers
  beforeRoute?: RouteHooks;
  // hook to run after bind route handlers
  afterRoute?: RouteHooks;
  // error handler
  errorHandler?: express.ErrorRequestHandler;
  // run when app is ready
  ready?: (app: App) => void;
  // options to init external services
  services?: ServicesOptionsMap;
}

export interface ServiceInitializeContext {
  srvs: ServiceGroup;
}

export interface Args {}

export interface App {
  srvs: ServiceGroup;
  express: Express;
  start: () => Promise<Server>;
}

export interface ServiceGroup extends DeeShare.ServiceGroup {
  $config: Config;
  [k: string]: Service;
}

export interface Service {}

export type ServiceInitializeFunc = (
  ctx: ServiceInitializeContext,
  args?: Args,
  callback?: (err: Error, srv?: Service) => void
) => Promise<Service> | void;

export interface Config {
  // namespace of service
  ns: string;
  // name of app
  name: string;
  // listenning host
  host?: string;
  // listenning port
  port?: number;
  // whether production mode
  prod?: boolean;
}

export type RouteHooks = (
  srvs: ServiceGroup,
  app: Express
) => void | express.RequestHandler[];

export interface ServicesOptionsMap {
  [k: string]: ServiceOptions;
}

export interface ServiceOptions {
  initialize: ServiceInitializeFunc | ServiceInitializeModule;
  args?: Args;
}

export type ServiceInitializeModule = string;

async function createSrvs(options: Options): Promise<ServiceGroup> {
  const { services: servicesOpts = {}, config } = options;
  const srvs: ServiceGroup = { $config: config };
  const promises = Object.keys(servicesOpts).map(srvName => {
    const srvOptions = servicesOpts[srvName];
    const ctx = { srvs } as ServiceInitializeContext;
    return createSrv(ctx, srvName, srvOptions);
  });
  await Promise.all(promises);
  return srvs;
}

async function createSrv(
  ctx: ServiceInitializeContext,
  srvName: string,
  options: ServiceOptions
): Promise<void> {
  let srvInitialize: ServiceInitializeFunc;
  if (typeof options.initialize === "string") {
    try {
      srvInitialize = require(options.initialize).init;
    } catch (err) {
      throw new Error(`servcie.${srvName}.initialize is a invalid module`);
    }
  } else {
    srvInitialize = options.initialize;
  }
  return new Promise<void>((resolve, reject) => {
    const promise = srvInitialize(ctx, options.args, (err, srv) => {
      if (err) {
        reject(new Error(`service.${srvName} has error, ${err.message}`));
        return;
      }
      ctx.srvs[srvName] = srv;
      resolve();
    });
    if (promise instanceof Promise) {
      return promise.then(srv => {
        ctx.srvs[srvName] = srv;
        resolve();
      });
    }
  });
}

function useMiddlewares(srvs: ServiceGroup, app: Express, hooks: RouteHooks) {
  if (typeof hooks === "function") {
    hooks(srvs, app);
    return;
  }
  for (const mid of Array<express.RequestHandler>(hooks)) {
    app.use(mid);
  }
}

function shimHandlers(handlers: swaggerize.HandlerFuncMap): void {
  Object.keys(handlers).forEach(operationId => {
    handlers[operationId] = tryWrapRequestHandler(handlers[operationId]);
  });
}

export async function init(options: Options): Promise<App> {
  const app = express();
  const srvs = await createSrvs(options);
  app.use((req, res, next) => {
    req.srvs = srvs;
    next();
  });
  if (options.beforeRoute) {
    useMiddlewares(srvs, app, options.beforeRoute);
  }
  shimHandlers(options.swaggerize.handlers);
  swaggerize(app, options.swaggerize);
  if (options.afterRoute) {
    useMiddlewares(srvs, app, options.afterRoute);
  }
  if (options.errorHandler) {
    app.use(options.errorHandler);
  }

  const start = () => {
    const port = options.config.port || DEFAULT_PORT;
    const host = options.config.host || DEFAULT_HOST;
    return new Promise<Server>((resolve, reject) => {
      const server = app.listen(port, host, err => {
        if (err) {
          reject(err);
          return;
        }
        resolve(server);
      });
    });
  };
  const deeApp = { srvs, express: app, start };
  if (options.ready) {
    options.ready(deeApp);
  }
  return deeApp;
}
