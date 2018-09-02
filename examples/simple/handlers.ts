import { Request, Response, NextFunction } from "../../packages/core";

export function hello(req: Request, res: Response, next: NextFunction) {
  const name = req.params.name || "stranger";
  res.json(name);
}
