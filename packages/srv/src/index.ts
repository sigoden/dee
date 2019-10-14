export interface ServiceGroup extends SrvExt.ServiceGroup {
  [k: string]: any;
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

export interface ServiceBase { };

export type Stop = () => void;
export type InitOutput<T> = { srv: T; stop?: Stop };
export interface InitFn<T, U, P extends { [k: string]: any }> {
  (ctx: SrvContext, args: U, ctor?: Ctor<T>, depends?: P): Promise<InitOutput<T>>;
  deps?: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace SrvExt {
    interface ServiceGroup { }
  }
}
