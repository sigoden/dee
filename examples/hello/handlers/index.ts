import { Request, Response, NextFunction } from "@sigodenjs/dee";
export async function hello(req: Request, res: Response, next: NextFunction) {
  const name = req.query.name;
  res.json({message: `${req.srvs.settings.prefix} ${name}`});
}