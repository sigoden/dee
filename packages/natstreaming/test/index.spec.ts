import * as DeeNatstreaming from "../src";
import { initApp, HANDLERS, delay } from "../../core/test-utils";

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
      producers: {
        sayHello: {
          schema: {
            name: { type: "string" }
          }
        }
      },
      subscribers: {
        "App.sayHello": {}
      },
      handlers: {
        "App.sayHello": (ctx: DeeNatstreaming.Context) => {
          expect(ctx.srvs).toBeDefined();
          expect(ctx.msg.getData().toString()).toBe('{"name":"tom"}');
        }
      }
    }
  };
  const app = await initApp(HANDLERS, { natstreaming: serviceOptions });
  const srv = <DeeNatstreaming.Service>app.srvs.natstreaming;
  await delay(1);
  await srv.producers.sayHello({ name: "tom" });
  srv.stan.close();
});
