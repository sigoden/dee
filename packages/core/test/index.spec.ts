import * as Dee from "../src";
import * as DeeSimple from "./fixtures/simple";
import * as supertest from "supertest";
import { initApp, HANDLERS, OPENAPI_FILE } from "../test-utils";

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
  const app = await initApp(HANDLERS);
  const name = "trump";
  const request = supertest(app.express);
  const resHello = await request.get("/hello?name=" + name).expect(200);
  expect(resHello.body).toBe(name);
  const resHey = await request.get("/hey/" + name).expect(200);
  expect(resHey.body).toBe(name);
});

test("should support array options.openapize", async () => {
  const app = await Dee.init({
    config: {
      ns: "proj",
      name: "App"
    },
    openapize: [{
      api: OPENAPI_FILE,
      handlers: HANDLERS
    }],
  });
  expect(app.start).toBeDefined();
});

describe("handler func", () => {
  test("should bind route to req", async () => {
    const app = await initApp({
      hello: (req: Dee.Request, res: Dee.Response, next: Dee.NextFunction) => {
        expect(req.srvs).toBeDefined();
        expect(req.openapi).toBeDefined();
        res.json("");
      }
    });
  });
});
