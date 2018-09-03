import { Request, Response, NextFunction } from "../../packages/core";

export function hello(req: Request, res: Response, next: NextFunction) {
  const name = req.query.name || "stranger";
  res.json(name);
}

export async function hey(req: Request, res: Response, next: NextFunction) {
  const name = await delay(10, req.params.name)
  await res.json(name);
}

function delay<T>(time: number, data: T) {
  return new Promise<T>(resolve => {
    setTimeout(() => {
      resolve(data);
    }, time);
  });
}
