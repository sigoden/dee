import { SrvContext, SrvConfig } from "@sigodenjs/dee-srv";
import { createSrv, ServiceOption, ServiceOptionMap, createSrvs } from "@sigodenjs/dee-srv-create";

export function createContext(config: SrvConfig = { prod: true, ns: "org", name: "App" }): SrvContext {
  return { config, srvs: {} };
}

export async function createSrvLite<T, U>(name: string, options: ServiceOption<T, U>): Promise<T> {
  const ctx = createContext();
  return createSrv(ctx, name, options);
};


export async function createSrvsLite(services: ServiceOptionMap = {}): Promise<SrvContext> {
  const ctx = createContext();
  await createSrvs(ctx, services);
  return ctx;
}

export function delay(time: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

