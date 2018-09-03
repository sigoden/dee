import * as swaggerize from "@sigodenjs/dee-swaggerize";
import * as express from "express";
import { ErrorRequestHandler, Express, RequestHandler } from "express";
import { Server } from "http";
import * as _ from "lodash";
import { tryWrapRequestHandler } from "./utils";

export { HandlerFuncMap } from "@sigodenjs/dee-swaggerize";
export { Request, Response, NextFunction, RequestHandler } from "express";

declare global {
  namespace Express {
    export interface Request {
      srvs: ServiceGroup;
    }
  }
  namespace Dee {
    interface ServiceGroup {}
  }
}

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
  errorHandler?: ErrorRequestHandler;
  // run when app is ready
  ready?: (app: App) => void;
  // options to init external services
  services?: ServicesOptionsMap;
}

export interface ServiceOptions extends ServiceOptionsBase {
  srvs: ServiceGroup;
}

export interface App {
  srvs: ServiceGroup;
  express: express.Express;
  start: () => Promise<Server>;
}

export interface ServiceGroup {
  $config: Config;
  [k: string]: Service;
}

export interface Service {}

export interface ServiceGroup {}

interface ServiceOptionsBase {
  initialize: ServiceInitializeFunc | ServiceInitializeModule;
  args?: any;
}

interface ServicesOptionsMap {
  [k: string]: ServiceOptionsBase;
}

type ServiceInitializeFunc = (
  options: ServiceOptions,
  callback?: (err: Error, srv?: Service) => void
) => Promise<Service> | void;

type ServiceInitializeModule = string;

interface Config {
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

type RouteHooks = (app: Express) => void | RequestHandler[];

async function createSrvs(options: Options): Promise<ServiceGroup> {
  const { services: servicesOpts = {}, config } = options;
  const srvs: ServiceGroup = { $config: config };
  const promises = Object.keys(servicesOpts).map(srvName => {
    const srvOptions = servicesOpts[srvName];
    const extendSrvoptions: ServiceOptions = _.extend(srvOptions, { srvs });
    return createSrv(srvName, extendSrvoptions);
  });
  await Promise.all(promises);
  return srvs;
}

async function createSrv(
  srvName: string,
  options: ServiceOptions
): Promise<void> {
  let srvInitialize: ServiceInitializeFunc;
  if (typeof options.initialize === "string") {
    try {
      const requiredModule = require(options.initialize);
      srvInitialize = requiredModule.default
        ? requiredModule.default
        : requiredModule;
    } catch (err) {
      throw new Error(`servcie.${srvName}.initialize is a invalid module`);
    }
  } else {
    srvInitialize = options.initialize;
  }
  return new Promise<void>((resolve, reject) => {
    const promise = srvInitialize(options, (err, srv) => {
      if (err) {
        reject(new Error(`service.${srvName} has error, ${err.message}`));
      }
      options.srvs[srvName] = srv;
      resolve();
    });
    if (promise instanceof Promise) {
      promise.then(() => resolve());
    }
  });
}

function useMiddlewares(app: express.Express, hooks: RouteHooks) {
  if (typeof hooks === "function") {
    hooks(app);
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

export default async function DeeInit(options: Options): Promise<App> {
  const app = express();
  const srvs = await createSrvs(options);
  app.use((req, res, next) => {
    req.srvs = srvs;
    next();
  });
  if (options.beforeRoute) {
    useMiddlewares(app, options.beforeRoute);
  }
  shimHandlers(options.swaggerize.handlers);
  swaggerize(app, options.swaggerize);
  if (options.afterRoute) {
    useMiddlewares(app, options.afterRoute);
  }
  if (options.errorHandler) {
    app.use(options.errorHandler);
  }

  const start = () => {
    const port = _.get(options, "config.port", 3000);
    const host = _.get(options, "config.host");
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
