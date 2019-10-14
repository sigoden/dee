import { SrvContext, BaseConfig } from "@sigodenjs/dee-srv";
import { createSrv, createSrvs } from "../src";
import * as DeeSimple from "./fixtures/echo";
import * as DeeAsync from "./fixtures/async";
import * as DeeAsyncDeps from "./fixtures/asyncDeps";

const DEFAULT_CONFIG: BaseConfig = { prod: true, ns: "org", name: "App" };

test("should create service", async () => {
  const data = { k: "v" };
  const ctx: SrvContext = { config: DEFAULT_CONFIG, srvs: {} };
  const { srv } = await createSrv<DeeSimple.Service<typeof data>, DeeSimple.Args>(ctx, "simple", {
    initialize: DeeSimple.init,
    args: data,
  });
  expect(srv.k).toBe("v");
});

test("should create services", async () => {
  const data1 = { k: "v" };
  const data2 = { k2: "v2" };
  const ctx: SrvContext = { config: DEFAULT_CONFIG, srvs: {} };
  const stops = await createSrvs(ctx, {
    simple1: {
      initialize: DeeSimple.init,
      args: data1,
    },
    simple2: {
      initialize: DeeSimple.init,
      args: data2,
    },
  });
  expect(stops.length).toEqual(2);
  expect(ctx.srvs["simple1"]).toEqual(data1);
  expect(ctx.srvs["simple2"]).toEqual(data2);
});

test("should create services considering service order", async () => {
  const orders = [];
  const ctx: SrvContext = { config: DEFAULT_CONFIG, srvs: {} };
  await createSrvs(ctx, {
    async1: {
      initialize: DeeAsyncDeps.init,
      deps: ["async2"],
      args: async (v) => {
        expect(v["asy"]).toEqual(ctx.srvs["async2"]);
        await delay(10);
        orders.push("async1");
      },
    },
    async2: {
      initialize: DeeAsync.init,
      args: async () => {
        await delay(50);
        orders.push("async2");
      },
    },
  });
  expect(orders).toEqual(["async2", "async1"]);
});

export function delay(time: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

