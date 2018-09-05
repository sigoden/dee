import * as swaggerize from "@sigodenjs/dee-swaggerize";
import * as express from "express";
import * as expressCore from "express-serve-static-core";
import { Server } from "http";
import "./global";
import { tryWrapRequestHandler } from "./utils";

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 3000;

declare namespace Dee {
  interface Request extends expressCore.Request {}
  interface Response extends expressCore.Response {}
  interface NextFunction extends expressCore.NextFunction {}
  interface RequestHandler extends expressCore.RequestHandler {}
  interface HandlerFuncMap extends swaggerize.HandlerFuncMap {}
  interface Express extends expressCore.Express {}

  // options to init dee app
  interface Options {
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

  interface ServiceInitializeContext {
    srvs: ServiceGroup;
  }

  interface Args {}

  interface App {
    srvs: ServiceGroup;
    express: Dee.Express;
    start: () => Promise<Server>;
  }

  interface ServiceGroup {
    $config: Config;
    [k: string]: Service;
  }

  interface Service {}

  type ServiceInitializeFunc = (
    ctx: ServiceInitializeContext,
    args?: Args,
    callback?: (err: Error, srv?: Service) => void
  ) => Promise<Service> | void;

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

  type RouteHooks = (
    srvs: Dee.ServiceGroup,
    app: Dee.Express
  ) => void | express.RequestHandler[];

  interface ServicesOptionsMap {
    [k: string]: ServiceOptions;
  }

  interface ServiceOptions {
    initialize: ServiceInitializeFunc | ServiceInitializeModule;
    args?: Args;
  }

  type ServiceInitializeModule = string;
}

async function createSrvs(options: Dee.Options): Promise<Dee.ServiceGroup> {
  const { services: servicesOpts = {}, config } = options;
  const srvs: Dee.ServiceGroup = { $config: config };
  const promises = Object.keys(servicesOpts).map(srvName => {
    const srvOptions = servicesOpts[srvName];
    const ctx = { srvs } as Dee.ServiceInitializeContext;
    return createSrv(ctx, srvName, srvOptions);
  });
  await Promise.all(promises);
  return srvs;
}

async function createSrv(
  ctx: Dee.ServiceInitializeContext,
  srvName: string,
  options: Dee.ServiceOptions
): Promise<void> {
  let srvInitialize: Dee.ServiceInitializeFunc;
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

function useMiddlewares(
  srvs: Dee.ServiceGroup,
  app: Dee.Express,
  hooks: Dee.RouteHooks
) {
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

async function Dee(options: Dee.Options): Promise<Dee.App> {
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

export = Dee;
