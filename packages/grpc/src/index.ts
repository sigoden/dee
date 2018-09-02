import * as grpcLoader from "@grpc/proto-loader";
import { Service, ServiceGroup, ServiceOptions } from "@sigodenjs/dee";
import * as grpc from "grpc";

export interface GrpcService extends Service {
  server?: grpc.Server;
  clients?: GrpcClientMap;
}

export interface GrpcServiceOptions extends ServiceOptions {
  args: GrpcArgs;
}

interface GrpcClientMap {
  [k: string]: GrpcClient;
}

interface GrpcClient extends grpc.Client {
  call: (
    name: string,
    args: any,
    metdata?: Metadata,
    callback?: (data: any) => void
  ) => Promise<any> | any;
}

interface GrpcArgs {
  // path to server proto file
  serverProtoFile?: string;
  // listenning host of server
  serverHost?: string;
  // listenning port of server
  serverPort?: number;
  // handler func for service
  serverHandlers: HandlerFuncMap;
  // path to client Proto file
  clientProtoFile?: string;
  // get uri for client service
  getClientUri?: (serviceName: string) => string;
  // check whether the client have permision to call the rpc
  havePermision?: CheckPermisionFunc;
}

type CheckPermisionFunc = (serviceName: string, id: string) => boolean;

interface HandlerFuncMap {
  [k: string]: HandlerFunc;
}

type HandlerFunc = (
  ctx: Context,
  callback?: (result: any) => void
) => Promise<void> | void;

interface Context {
  request: any;
  metadata: Metadata;
  srvs: ServiceGroup;
}

interface Metadata {
  origin: string;
}

export default async function init(
  options: GrpcServiceOptions
): Promise<GrpcService> {
  const { serverProtoFile, clientProtoFile } = options.args;
  const srv: GrpcService = {};
  if (serverProtoFile) {
    srv.server = await createServer(options);
  }
  if (serverProtoFile) {
    srv.clients = await createClients(options);
  }
  return srv;
}

async function createServer(options: GrpcServiceOptions): Promise<grpc.Server> {
  const {
    serverProtoFile,
    serverHandlers,
    havePermision = () => true,
    serverHost = "127.0.0.1",
    serverPort = "4444"
  } = options.args;
  const { ns, name } = options.srvs.$config;
  const protoRoot = loadProtoFile(serverProtoFile);
  let proto: grpc.GrpcObject;
  try {
    proto = protoRoot[ns][name];
  } catch (err) {
    throw new Error(`no grpc service at ${ns}.${name}`);
  }
  shimHandlers(serverHandlers, havePermision);
  const server = new grpc.Server();
  server.addService(proto.service, serverHandlers);
  // TODO support more credential
  server.bind(
    `${serverHost}:${serverPort}`,
    grpc.ServerCredentials.createInsecure()
  );
  server.start();
  return server;
}

function shimHandlers(
  handlers: HandlerFuncMap,
  havePermision: CheckPermisionFunc
): void {
  Object.keys(handlers).forEach(id => {
    const fn = handlers[id];
    handlers[id] = (ctx: Context, callback?: (result: any) => void) => {
      if (!havePermision(ctx.metadata.origin, id)) {
        callback({
          code: grpc.status.PERMISSION_DENIED,
          message: "Permission denied"
        });
        return;
      }
      tryWrapHandler(fn)(ctx, callback);
    };
  });
}

async function createClients(
  options: GrpcServiceOptions
): Promise<GrpcClientMap> {
  const clients: GrpcClientMap = {};
  const { clientProtoFile, getClientUri = v => v } = options.args;
  const { ns, name } = options.srvs.$config;
  const protoRoot = loadProtoFile(clientProtoFile);
  const proto = protoRoot[ns];
  Object.keys(proto).forEach(serviceName => {
    const Client = proto[serviceName];
    if (Client.name !== "ServiceClient") {
      return;
    }
    const client = new Client(
      getClientUri(serviceName),
      grpc.credentials.createInsecure()
    );
    client.call = (
      funcName: string,
      args: any,
      metadata?: Metadata,
      callback?: (data: any) => void
    ) => {
      metadata.origin = name;
      const fn = client[funcName];
      const unSupportedRes = {
        message: serviceName + "." + funcName + " is not supported",
        status: grpc.status.UNIMPLEMENTED
      };
      if (callback) {
        if (!fn) {
          callback(unSupportedRes);
          return;
        }
        fn.call(client, args, metadata, callback);
      }
      if (!fn) {
        return Promise.resolve(unSupportedRes);
      }
      return new Promise(resolve => {
        fn.call(client, args, metadata, data => {
          resolve(data);
        });
      });
    };
    clients[serviceName] = client;
  });
  return clients;
}

function loadProtoFile(filename: string): grpc.GrpcObject {
  return grpc.loadPackageDefinition(grpcLoader.loadSync(filename));
}

export function tryWrapHandler(fn: HandlerFunc): HandlerFunc {
  const type = Object.prototype.toString.call(fn);
  if (type === "[object AsyncFunction]") {
    return (ctx: Context, callback?: (result: any) => void) => {
      const fnReturn = fn(ctx, callback);
      Promise.resolve(fnReturn).catch(callback);
    };
  }
  return fn;
}
