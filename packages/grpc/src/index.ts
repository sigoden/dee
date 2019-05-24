import * as grpcLoader from "@grpc/proto-loader";
import * as Dee from "@sigodenjs/dee";
import * as grpc from "grpc";

interface ServiceExt<T = { [k: string]: any }> {
  server?: grpc.Server;
  clients?: T;
}

export type Service<T> = Dee.Service & ServiceExt<ClientsMapT<T>>;

export type ServiceOptions = Dee.ServiceOptionsT<Args>;

export interface Args {
  // path to server proto file
  serverProtoFile?: string;
  // handler func for service
  serverHandlers?: HandlerFuncMap;
  // path to client Proto file
  clientProtoFile?: string;
  // check whether the client have permision to call the rpc
  havePermision?: CheckPermisionFunc;
  getServerBindOptions?: (ctx: Dee.ServiceInitializeContext) => ServerBindOptions;
  getClientConstructOptions?: (serviceName: string, ctx: Dee.ServiceInitializeContext) => ClientConstructOptions;
}

export interface ServerBindOptions {
  address: string;
  credentials: grpc.ServerCredentials;
}

export interface ClientConstructOptions {
  address: string;
  credentials: grpc.ChannelCredentials;
  options?: object;
}

export interface ClientMap {
  [k: string]: Client;
}

export type ClientsMapT<T> = { [k in keyof T]: Client };

export interface Client {
  call: (name: string, args: any, metdata?: grpc.Metadata) => Promise<any>;
  grpcClient: grpc.Client;
}

export type CheckPermisionFunc = (serviceName: string, id: string) => boolean;

export interface HandlerFuncMap {
  [k: string]: HandlerFunc;
}

export type HandlerFunc = (ctx: Context) => Promise<any>;

export interface Context {
  request: any;
  metadata: grpc.Metadata;
  srvs: Dee.ServiceGroup;
}

export async function init<T extends ClientMap>(ctx: Dee.ServiceInitializeContext, args: Args): Promise<Service<T>> {
  const { serverProtoFile, clientProtoFile } = args;
  const srv: Service<T> = {};
  if (serverProtoFile) {
    srv.server = await createServer(ctx, args);
  }
  if (clientProtoFile) {
    srv.clients = await createClients(ctx, args);
  }
  return srv;
}

async function createServer(ctx: Dee.ServiceInitializeContext, args: Args): Promise<grpc.Server> {
  const { serverProtoFile, serverHandlers, havePermision = () => true, getServerBindOptions } = args;
  const { ns, name } = ctx.srvs.$config;
  const protoRoot = loadProtoFile(serverProtoFile);
  let proto: grpc.GrpcObject;
  try {
    proto = protoRoot[ns][name];
  } catch (err) {
    throw new Error(`no grpc service at ${ns}.${name}`);
  }
  const server = new grpc.Server();
  server.addService(proto.service, shimHandlers(serverHandlers, havePermision, ctx.srvs));
  if (typeof getServerBindOptions !== "function") {
    throw new Error(`getServerBindOptions is required`);
  }
  const bindOptions = getServerBindOptions(ctx);
  server.bind(bindOptions.address, bindOptions.credentials);
  server.start();
  return server;
}

function shimHandlers(handlers: HandlerFuncMap, havePermision: CheckPermisionFunc, srvs: Dee.ServiceGroup) {
  const result = {};
  Object.keys(handlers).forEach(id => {
    const fn = handlers[id];
    result[id] = (ctx: Context, cb) => {
      const origin = ctx.metadata.get("origin");
      if (!havePermision(String(origin[0]), id)) {
        cb({
          code: grpc.status.PERMISSION_DENIED,
          message: "Permission denied"
        });
        return;
      }
      ctx.srvs = srvs;
      fn(ctx)
        .then(res => cb(null, res))
        .catch(cb);
    };
  });
  return result;
}

async function createClients<T>(ctx: Dee.ServiceInitializeContext, args: Args): Promise<T> {
  const clients = {} as T;
  const { clientProtoFile, getClientConstructOptions } = args;
  const { ns, name } = ctx.srvs.$config;
  const protoRoot = loadProtoFile(clientProtoFile);
  const proto = protoRoot[ns];
  Object.keys(proto).forEach(serviceName => {
    const GrpcClientObj = proto[serviceName];
    if (GrpcClientObj.name !== "ServiceClient") {
      return;
    }
    const GrpcClient: typeof grpc.Client = GrpcClientObj;
    if (typeof getClientConstructOptions !== "function") {
      throw new Error(`getClientConstructOptions is required`);
    }
    const constructOptions = getClientConstructOptions(serviceName, ctx);
    const grpcClient = new GrpcClient(constructOptions.address, constructOptions.credentials, constructOptions.options);
    const client: Client = {
      grpcClient,
      call: (funcName: string, data: any, metadata?: grpc.Metadata) => {
        if (!metadata) {
          metadata = new grpc.Metadata();
        }
        metadata.add("origin", name);
        const fn = grpcClient[funcName];
        const unSupportedRes = {
          message: serviceName + "." + funcName + " is not supported",
          status: grpc.status.UNIMPLEMENTED
        };
        return new Promise((resolve, reject) => {
          if (!fn) {
            return reject(unSupportedRes);
          }
          grpcClient[funcName](data, metadata, (err, res) => {
            if (err) {
              return reject(err);
            }
            resolve(res);
          });
        });
      }
    };
    clients[serviceName] = client;
  });
  return clients;
}

function loadProtoFile(filename: string): grpc.GrpcObject {
  return grpc.loadPackageDefinition(grpcLoader.loadSync(filename));
}
