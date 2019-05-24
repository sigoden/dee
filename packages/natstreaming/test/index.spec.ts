import { delay, HANDLERS, initApp } from "../../core/test-utils";
import * as DeeNatstreaming from "../src";

const producers = {
  sayHello: {
    schema: {
      name: { type: "string" }
    }
  }
};
const subscribers = {
  "App.sayHello": {}
};

test("should create natstreaming service", async () => {
  const serviceOptions = <DeeNatstreaming.ServiceOptions>{
    initialize: DeeNatstreaming.init,
    args: {
      client: {
        clusterId: "test-cluster",
        stanOptions: {
          url: "nats://localhost:4322"
        }
      },
      producers,
      subscribers,
      handlers: {
        "App.sayHello": (ctx: DeeNatstreaming.Context) => {
          expect(ctx.srvs).toBeDefined();
          expect(ctx.msg.getData().toString()).toBe('{"name":"tom"}');
        }
      }
    }
  };
  const app = await initApp(HANDLERS, { natstreaming: serviceOptions });
  const srv = <DeeNatstreaming.Service<typeof producers, typeof subscribers>>app.srvs.natstreaming;
  await delay(1);
  await srv.producers.sayHello({ name: "tom" });
  srv.stan.close();
});
