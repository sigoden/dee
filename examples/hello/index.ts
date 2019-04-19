import * as Dee from "@sigodenjs/dee";
import * as path from "path";
import * as handlers from "./handlers";

Dee.init({
  config: {
    ns: "proj",
    name: "App"
  },
  openapize: {
    api: path.resolve(__dirname, "./openapi.yaml"), //  Openapi doc file
    handlers
  },
  errorHandler(
    err: Error,
    req: Dee.Request,
    res: Dee.Response,
    next: Dee.NextFunction
  ) {
    if(err instanceof Dee.ValidationError) {
      res.status(400);
      res.json({code: "ErrValidation", message: "Validation Error",  extra: err.errors });
      return;
    }
    res.status(500);
    res.json({code: "ErrFatal", message: err.message});
  },
}).then(app => {
  app.start();
}).catch(err => {
  console.error(err);
});
