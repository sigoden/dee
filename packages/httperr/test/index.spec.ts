import { createSrvLite } from "@sigodenjs/dee-srv-test-utils";
import * as DeeHttpErr from "../src";

const ErrCodes = {
  ErrInvalidField: {
    status: 400,
    message: "field ${field} invalid",
  },
};
test("should create httperr service", async () => {
  const srv = await createSrvLite<DeeHttpErr.Service<typeof ErrCodes>, DeeHttpErr.Args>("errs", {
    initialize: DeeHttpErr.init,
    args: ErrCodes,
  });
  const err = srv.ErrInvalidField.toError({ field: "name" });
  expect(err.name).toBe("ErrInvalidField");
  expect(err.message).toBe("field name invalid");
});
