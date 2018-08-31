import { Express, Request, Response, NextFunction } from 'express-serve-static-core';
import { Server } from 'http';
import { Route } from '@sigodenjs/dee-swaggerize';
import * as mongoose from 'mongoose';
import * as redis from 'ioredis';
import * as sequelize from 'sequelize';

declare function Dee(options: DeeOptions, callback: (err: Error, app: App) => void): void;

interface DeeOptions {
  swaggerize: SwaggerizeOptions;
  services: BuiltinServcie | Map<ServiceOptions<any>>;
}

interface Map<T> {
  [key: string]: T;
}

interface ServiceOptions<T> {
  constructor: (options: ServiceOptions<T>, cb: (err: Error, srv: object) => void) => void;
  constructorArgs?: T;
}

type BuiltinServcie = Map<
  ServiceOptions<LoggerConstructorArgs | MongoConstructorArgs | RedisConstructorArgs | SequelizeConstructorArgs>
>;

interface SwaggerizeOptions {
  // path to swagger file, yaml or json
  swaggerFile: string;
  // handler funcs
  handlers: Map<HandlerFunc>;
  // security funcs
  security: Map<HandlerFunc>;
  // map routes
  routeIteratee: (route: Route) => Route;
}

interface LoggerConstructorArgs {
  level: 'emerg' | 'alert' | 'crit' | 'error' | 'warning' | 'notice' | 'info' | 'debug';
  format: string;
  transporters: Map<object>;
}

interface MongoConstructorArgs {
  url: string;
  options: mongoose.ConnectionOptions;
}

interface RedisConstructorArgs extends redis.RedisOptions {}

interface SequelizeConstructorArgs extends sequelize.Options {}

type HandlerFunc = HandlerFuncCallback | HandlerFuncPromise;

type HandlerFuncCallback = (req: Request, res: Request, next: NextFunction) => void;
type HandlerFuncPromise = (req: Request, res: Response, next) => Promise<any>;

type Srvs = any;

interface App {
  srvs: Srvs;
  express: Express;
  start: () => Server;
}

export = Dee;
