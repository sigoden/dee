import * as path from "path";
import * as Dee from "../src/";
import { ServiceOptionMap } from "@sigodenjs/dee-srv-create";

export const OPENAPI_FILE = path.resolve(__dirname, "./openapi.yaml");

export function initApp(handlers: Dee.HandlerFuncMap, services?: ServiceOptionMap): Promise<Dee.App> {
  return Dee.init({
    config: {
      ns: "proj",
      name: "App",
    },
    openapize: {
      api: OPENAPI_FILE,
      handlers,
    },
    services,
  });
}

export const HANDLERS = {
  hello: (req: Dee.Request, res: Dee.Response) => {
    const name = req.query.name || "stranger";
    res.json(name);
  },
  hey: Dee.resolveAsynRequestHandler(async (req: Dee.Request, res: Dee.Response) => {
    await delay(1);
    const name = req.params.name;
    res.json(name);
  }),
};

export function delay(time: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}
