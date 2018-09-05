import { ServiceGroup } from "./index";

declare global {
  namespace Dee {
    interface ServiceGroup {}
  }
  namespace Express {
    interface Request {
      srvs: ServiceGroup;
    }
  }
}
