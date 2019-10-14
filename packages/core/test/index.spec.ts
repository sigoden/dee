import * as supertest from "supertest";
import * as Dee from "../src";
import { HANDLERS, initApp, OPENAPI_FILE } from "../test-utils";
import * as DeeEcho from "@sigodenjs/dee-echo";

test("should create app instance", async () => {
  const app = await initApp({});
  expect(app.start).toBeDefined();
});

test("should init and bind service", async () => {
  const args = {};
  const app = await initApp({}, { echo : { initialize: DeeEcho.init, args } });
  const srv = app.srvs.echo;
  expect(srv).toBeDefined();
  expect(srv).toBe(args);
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
      name: "App",
    },
    openapize: [
      {
        api: OPENAPI_FILE,
        handlers: HANDLERS,
      },
    ],
  });
  expect(app.start).toBeDefined();
});

describe("handler func", () => {
  test("should bind route to req", async () => {
    await initApp({
      hello: (req: Dee.Request, res: Dee.Response) => {
        expect(req.srvs).toBeDefined();
        expect(req.openapi).toBeDefined();
        res.json("");
      },
    });
  });
});
