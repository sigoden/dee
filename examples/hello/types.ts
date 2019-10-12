import * as DeeEcho from "@sigodenjs/dee-echo";
import * as settings from "./settings";
export type ServiceSettings = DeeEcho.Service<typeof settings>;

declare global {
  namespace SrvExt {
    interface ServiceGroup {
      settings: ServiceSettings;
    }
  }
}