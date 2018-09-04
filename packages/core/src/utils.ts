import { NextFunction, Request, RequestHandler, Response } from "express";

export function tryWrapRequestHandler(fn: RequestHandler): RequestHandler {
  const type = Object.prototype.toString.call(fn);
  if (type === "[object AsyncFunction]") {
    return (req: Request, res: Response, next: NextFunction) => {
      const fnReturn = fn(req, res, next);
      Promise.resolve(fnReturn).catch(next);
    };
  }
  return fn;
}
