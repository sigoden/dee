import * as Openapize from "@sigodenjs/openapize";
import * as express from "express";
import { Server } from "http";

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 3000;

declare global {
  namespace DeeShare {
    interface ServiceGroup {}
  }
}

export { SecurityError, ValidationError } from "@sigodenjs/openapize";

export interface Request extends Openapize.RequestExt {
  srvs: ServiceGroup;
}
export interface Response extends express.Response {}
export interface NextFunction {
    // tslint:disable-next-line callable-types (In ts2.1 it thinks the type alias has no call signatures)
    (err?: any): void;
}
export interface RequestHandler {
    // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2
    (req: Request, res: Response, next: NextFunction): any;
}

export interface HandlerFuncMap extends Openapize.HandlerFuncMap {}
export interface Express extends express.Application {
    request: Request;
    response: Response;
}
export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

// options to init dee app
export interface Options {
  // general config
  config: Config;
  // options to init openapize service
  openapize: Openapize.Options | Openapize.Options[];
  // hook to run before bind route handlers
  beforeRoute?: RouteHooks;
  // hook to run after bind route handlers
  afterRoute?: RouteHooks;
  // error handler
  errorHandler?: RequestHandler;
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
  $services?: ServicesOptionsMap;
  [k: string]: any;
}

export type RouteHooks = (
  srvs: ServiceGroup,
  app: Express
) => void | RequestHandler[];

export interface ServicesOptionsMap {
  [k: string]: ServiceOptions;
}

export interface ServiceOptions {
  initialize: ServiceInitializeFunc | ServiceInitializeModule;
  args?: Args;
}

export interface ServiceOptionsT<T> extends ServiceOptions {
  args: T;
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
      promise
        .then(srv => {
          ctx.srvs[srvName] = srv;
          resolve();
        })
        .catch(err => {
          reject(err);
        });
    }
  });
}

function useMiddlewares(srvs: ServiceGroup, app: Express, hooks: RouteHooks) {
  if (typeof hooks === "function") {
    hooks(srvs, app);
    return;
  }
  for (const mid of Array<RequestHandler>(hooks)) {
    app.use(mid);
  }
}

export async function init(options: Options): Promise<App> {
  const app = express() as Express;
  const srvs = await createSrvs(options);
  app.use((req: Request, res, next) => {
    req.srvs = srvs;
    next();
  });
  if (options.beforeRoute) {
    useMiddlewares(srvs, app, options.beforeRoute);
  }
  if (Array.isArray(options.openapize)) {
    for (const openapizeOptions of options.openapize) {
      await Openapize.openapize(app, openapizeOptions);
    }
  } else {
    await Openapize.openapize(app, options.openapize);
  }
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
  options.config.$services = options.services;
  return deeApp;
}

export function resolveAsynRequestHandler(
  fn: AsyncRequestHandler
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const fnReturn = fn(req, res, next);
    Promise.resolve(fnReturn).catch(next);
  };
}
