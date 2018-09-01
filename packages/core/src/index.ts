import * as express from "express";
import { Express, RequestHandler, ErrorRequestHandler } from "express";
import * as _ from "lodash";
import swaggerize, { SwaggerizeOptions } from "@sigodenjs/dee-swaggerize";
import { Server } from "http";
import { tryWrapRequestHandler } from "./utils";

declare global {
  namespace Express {
    export interface Request {
      srvs: ServiceGroup;
    }
  }
  namespace Dee {
    export interface ServiceGroup {}
  }
}

// options to init dee app
export interface DeeOptions {
  // general config
  config: Config;
  // options to init swaggerize service
  swaggerize: SwaggerizeOptions;
  // hook to run before bind route handlers
  beforeRoute?: RouteHooks;
  // hook to run after bind route handlers
  afterRoute?: RouteHooks;
  // error handler
  errorHandler?: ErrorRequestHandler;
  // run when app is ready
  ready?: (app: App) => void;
  // options to init external services
  services: ServicesOptionsMap;
}

export interface ServiceOptions extends ServiceOptionsBase {
  srvs: ServiceGroup;
}

export interface App {
  srvs: ServiceGroup;
  express: express.Express;
  start: () => Server;
}

export interface ServiceGroup {
  $config: Config;
  [k: string]: Service;
}

export interface Service {}

interface ServiceOptionsBase {
  initialize: ServiceInitializeFunc | ServiceInitializeModule;
  args?: any;
}

interface HandlerFuncMap {
  [k: string]: RequestHandler;
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
  host: string;
  // listenning port
  port: number;
  // whether production mode
  prod: boolean;
}

type RouteHooks = (app: Express) => void | Array<RequestHandler>;

async function createSrvs(options: DeeOptions): Promise<ServiceGroup> {
  let { services: servicesOpts, config } = options;
  let srvs: ServiceGroup = { $config: config };
  let promises = Object.keys(servicesOpts).map(srvName => {
    let srvOptions = servicesOpts[srvName];
    let options: ServiceOptions = _.extend(srvOptions, { srvs });
    return createSrv(srvName, options);
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
      srvInitialize = require(options.initialize);
    } catch (err) {
      throw new Error(`servcie.${srvName}.initialize is a invalid module`);
    }
  } else {
    srvInitialize = options.initialize;
  }
  return new Promise<void>((resolve, reject) => {
    let promise = srvInitialize(options, (err, srv) => {
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
  for (let mid of Array<express.RequestHandler>(hooks)) {
    app.use(mid);
  }
}

function shimHandlers(handlers: HandlerFuncMap): void {
  for (let operationId in handlers) {
    handlers[operationId] = tryWrapRequestHandler(handlers[operationId]);
  }
}

export default async function Dee(options: DeeOptions): Promise<App> {
  let app = express();
  let srvs = await createSrvs(options);
  app.use(function(req, _, next) {
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

  let start = function() {
    let port = _.get(options, "config.port", 3000);
    let host = _.get(options, "config.host");
    let server = app.listen(port, host);
    return server;
  };
  let deeApp = { srvs: srvs, express: app, start };
  if (options.ready) {
    options.ready(deeApp);
  }
  return deeApp;
}

module.exports = Dee;
