export interface ServiceGroup extends SrvExt.ServiceGroup {
  [k: string]: any;
}

export interface SrvContext {
  config: BaseConfig;
  srvs: ServiceGroup;
}

export interface BaseConfig {
  /**
   * 名称空间
   */
  ns: string;
  /**
   * 应用名
   */
  name: string;
  /**
   * 是否生产环境
   */
  prod?: boolean;
}

export interface IService { };

export type Stop = () => void;
export type InitOutput<T> = { srv: T, stop?: Stop };
export interface InitFn<T, U, P extends {[k: string]: any}> {
  (ctx: SrvContext, args: U, depends?: P): Promise<InitOutput<T>>
  deps?: string[]
}

declare global {
  namespace SrvExt {
    interface ServiceGroup { }
  }
}
