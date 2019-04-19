import { Request, Response, NextFunction } from "@sigodenjs/dee";
export function hello(req: Request, res: Response, next: NextFunction) {
  const name = req.query.name;
  res.json({message: `hello ${name}`});
}