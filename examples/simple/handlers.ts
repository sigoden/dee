import { Request, Response, NextFunction } from "../../packages/core";

export function hello(req: Request, res: Response, next: NextFunction) {
  const name = req.query.name || "stranger";
  res.json(name);
}

export async function hey(req: Request, res: Response, next: NextFunction) {
  await delay(10);
  const name = req.params.name;
  res.json(name);
}

function delay(time: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}
