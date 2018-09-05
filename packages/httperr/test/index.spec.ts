import * as DeeHttpErr from "../src";
import { initApp, HANDLERS } from "../../core/test-utils";

test("should create httperr service", async () => {
  const serviceOptions = <DeeHttpErr.ServiceOptions>{
    initialize: DeeHttpErr,
    args: {
      ErrInvalidField: {
        status: 400,
        message: "field ${field} invalid"
      }
    }
  };
  const app = await initApp(HANDLERS, { httperr: serviceOptions });
  const srv = <DeeHttpErr.Service>app.srvs.httperr;
  const err = srv.ErrInvalidField.toError({ field: "name" });
  expect(err.name).toBe("ErrInvalidField");
  expect(err.message).toBe("field name invalid");
});
