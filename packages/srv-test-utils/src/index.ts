import { SrvContext, BaseConfig, Stop } from "@sigodenjs/dee-srv";
import { createSrv, ServiceOption, ServiceOptionMap, CreateSrvOutput, createSrvs } from "@sigodenjs/dee-srv-create";

export function createContext(config: BaseConfig = { prod: true, ns: "org", name: "App" }): SrvContext {
  return { config, srvs: {} };
}

export async function createSrvLite<T, U>(name: string, options: ServiceOption<U>): Promise<CreateSrvOutput<T>> {
  const ctx = createContext();
  return createSrv(ctx, name, options)
};


export async function createSrvsLite(services: ServiceOptionMap = {}): Promise<Stop[]> {
  const ctx = createContext();
  return createSrvs(ctx, services);
}

export function delay(time: number) {
  return new Promise<void>(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

