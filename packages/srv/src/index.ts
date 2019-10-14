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

export interface IService { }; // eslint-disable-line 

export type Stop = () => void;
export type InitOutput<T> = { srv: T; stop?: Stop };
export interface InitFn<T, U, P extends {[k: string]: any}> {
  (ctx: SrvContext, args: U, ctor?: new() => T, depends?: P): Promise<InitOutput<T>>;
  deps?: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace SrvExt {
    interface ServiceGroup { } 
  }
}
