export interface ServiceGroup extends SrvExt.ServiceGroup {
  [k: string]: ServiceBase;
}

export interface SrvContext {
  config: SrvConfig;
  srvs: ServiceGroup;
}

export interface Ctor<T> {
  new(...args: any): T;
}

export interface SrvConfig {
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

export const INIT_KEY = Symbol("init");
export const STOP_KEY = Symbol("stop");
export const READY_KEY = Symbol("ready");

export interface ServiceBase {
  [k: string]: any;
  [INIT_KEY]?: () => Promise<void> | void;
  [STOP_KEY]?: () => Promise<void> | void;
  [READY_KEY]?: () => Promise<void> | void;
};

export interface InitFn<T extends ServiceBase, U, P extends { [k: string]: any }> {
  (ctx: SrvContext, args: U, ctor?: Ctor<T>, depends?: P): Promise<T>;
  deps?: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace SrvExt {
    interface ServiceGroup { }
  }
}
