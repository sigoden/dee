import * as Dee from "../src/index";
import * as path from "path";
import * as DeeSimple from "./fixtures/service";
import * as supertest from "supertest";

const SWAGGER_FILE = path.resolve(__dirname, "../../../examples/simple/swagger.yaml");

function initApp(
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

test("should create app instance", async () => {
  const app = await initApp({});
  expect(app.start).toBeDefined();
});

test("should autobind $config service", async () => {
  const app = await initApp({});
  expect(app.srvs.$config.ns).toBe("proj");
  expect(app.srvs.$config.name).toBe("App");
});

test("should init and bind service", async () => {
  const args = {};
  const app = await initApp({}, { simple: { initialize: DeeSimple, args } });
  const srv = <DeeSimple.Service>app.srvs.simple;
  expect(srv).toBeDefined();
  expect(srv.args).toBe(args);
});

test("should autobind route", async () => {
  const app = await initApp({
    hello: (req: Dee.Request, res: Dee.Response, next: Dee.NextFunction) => {
      const name = req.query.name || "stranger";
      res.json(name);
    },
    hey: async (
      req: Dee.Request,
      res: Dee.Response,
      next: Dee.NextFunction
    ) => {
      const name = await delay(1, req.params.name);
      res.json(name);
    }
  });
  const name = "trump";
  const request = supertest(app.express);
  const resHello = await request.get("/hello?name=" + name).expect(200);
  expect(resHello.body).toBe(name);
  const resHey = await request.get("/hey/" + name).expect(200);
  expect(resHey.body).toBe(name);
});

describe("handler func", () => {
  test("should bind route to req", async () => {
    const app = await initApp({
      hello: (req: Dee.Request, res: Dee.Response, next: Dee.NextFunction) => {
        expect(req.srvs).toBeDefined();
        expect(req.swagRoute).toBeDefined();
        res.json("");
      }
    });
  });
});

function delay<T>(time: number, data: T) {
  return new Promise<T>(resolve => {
    setTimeout(() => {
      resolve(data);
    }, time);
  });
}
