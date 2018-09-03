import Dee, { HandlerFuncMap } from "../src/index";
import * as path from "path";

async function initApp(handlers: HandlerFuncMap) {
  return Dee({
    config: {
      ns: "proj",
      name: "App"
    },
    swaggerize: {
      api: path.resolve(__dirname, "./swagger.yaml"),
      handlers,
    }
  });
}