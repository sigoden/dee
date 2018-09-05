import * as Dee from "../src/";
import * as fs from "fs";
import * as path from "path";

export const SWAGGER_FILE = path.resolve(__dirname, "./swagger.yaml");

export function initApp(
  handlers: Dee.HandlerFuncMap,
  services?: Dee.ServicesOptionsMap
): Promise<Dee.App> {
  return Dee({
    config: {
      ns: "proj",
      name: "App"
    },
    swaggerize: {
      api: SWAGGER_FILE,
      handlers
    },
    services
  });
}

export const HANDLERS = {
  hello: (req: Dee.Request, res: Dee.Response, next: Dee.NextFunction) => {
    const name = req.query.name || "stranger";
    res.json(name);
  },
  hey: async (req: Dee.Request, res: Dee.Response, next: Dee.NextFunction) => {
    await delay(1);
    const name = req.params.name;
    res.json(name);
  }
};

export function delay(time: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}
