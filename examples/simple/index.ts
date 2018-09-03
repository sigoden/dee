import * as Dee from "../../packages/core";
import * as path from "path";
import * as handlers from "./handlers";

Dee({
  config: {
    ns: "proj",
    name: "App"
  },
  swaggerize: {
    api: path.resolve(__dirname, "./swagger.yaml"),
    handlers
  }
}).then(app => {
  app.start();
});
