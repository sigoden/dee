import { Request, Response, NextFunction } from "@sigodenjs/dee";
export function hello(req: Request, res: Response, next: NextFunction) {
  const name = req.query.name;
  req.srvs.redis; // access redis service
  res.json({message: `hello ${name}`});
}