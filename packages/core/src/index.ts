/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-interface */
import * as Openapize from "@sigodenjs/openapize";
import * as express from "express";
import * as createDebug from "debug";
import { ServiceGroup, SrvContext, SrvConfig, STOP_KEY } from "@sigodenjs/dee-srv";
import { createSrvs, ServiceOptionMap } from "@sigodenjs/dee-srv-create";
import { Server } from "http";
import { Request, Response, NextFunction, RequestHandler, Express, ErrorRequestHandler } from "express";

export { SecurityError, ValidationError } from "@sigodenjs/openapize";

export { Request, Response, NextFunction, RequestHandler, Express, ErrorRequestHandler, ServiceGroup };

const debugDee = createDebug("dee");

declare module "express" {
  interface Request {
    openapi: Openapize.API;
    srvs: ServiceGroup;
  }
}

const DEFAULT_HOST = "localhost";
const DEFAULT_PORT = 3000;

export interface HandlerFuncMap extends Openapize.HandlerFuncMap { }

export type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

// options to init dee app
export interface Options {
  // general config
  config: Config;
  // options to init openapize service
  openapize?: Openapize.Options | Openapize.Options[];
  // hook to run before bind route handlers
  beforeRoute?: RouteHooks;
  // hook to run after bind route handlers
  afterRoute?: RouteHooks;
  // error handler
  errorHandler?: ErrorRequestHandler;
  // run when app is ready
  ready?: (app: App) => void;
  // options to init external services
  services?: ServiceOptionMap;
}

export interface App {
  srvs: ServiceGroup;
  express: Express;
  start: () => Promise<Server>;
  stop: () => Promise<void>;
}

export interface Service { }

export interface Config extends SrvConfig {
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
  [k: string]: any;
}

export type RouteHooks = (srvs: ServiceGroup, app: Express) => void | RequestHandler[];

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
  debugDee("init");
  const app = express();
  const srvContext: SrvContext = { config: options.config, srvs: { $config: options.config as any } };
  await createSrvs(srvContext, options.services);
  const srvs = srvContext.srvs;
  app.use((req: Request, res, next) => {
    req.srvs = srvs;
    next();
  });
  if (options.beforeRoute) {
    debugDee("beforeRoute");
    useMiddlewares(srvs, app, options.beforeRoute);
  }
  debugDee("openize");
  if (Array.isArray(options.openapize)) {
    for (const openapizeOptions of options.openapize) {
      await Openapize.openapize(app, openapizeOptions);
    }
  } else if (options.openapize) {
    await Openapize.openapize(app, options.openapize);
  }
  if (options.afterRoute) {
    debugDee("afterRoute");
    useMiddlewares(srvs, app, options.afterRoute);
  }

  const start = () => {
    const port = options.config.port || DEFAULT_PORT;
    const host = options.config.host || DEFAULT_HOST;
    return new Promise<Server>(resolve => {
      if (options.errorHandler) {
        app.use(options.errorHandler);
      }
      debugDee(`listen ${host}:${port}`);
      const server = app.listen(port, host, () => {
        resolve(server);
      });
    });
  };
  const stop = async () => {
    const errs = [];
    await Promise.all(Object.keys(srvs).map(async key => {
      if (srvs[key][STOP_KEY]) {
        try {
          await srvs[key][STOP_KEY]();
        } catch (err) {
          errs.push({ err, key });
        }
      }
    }));
    if (errs.length > 0) {
      throw new DeeStopError(errs);
    }
  };
  const deeApp = { srvs, express: app, start, stop };
  if (options.ready) {
    debugDee("ready");
    options.ready(deeApp);
  }
  return deeApp;
}

export function resolveAsynRequestHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const fnReturn = fn(req, res, next);
    Promise.resolve(fnReturn).catch(next);
  };
}

export interface ErrItem {
  key: string;
  err: any;
}
export class DeeStopError extends Error {
  public readonly errs: ErrItem[]
  constructor(errs: ErrItem[]) {
    super("dee cannot stop");
    this.errs = errs;
    this.name = "DeeStopError";
  }
}
