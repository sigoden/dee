import * as grpcLoader from "@grpc/proto-loader";
import * as Dee from "@sigodenjs/dee";
import * as grpc from "grpc";

declare global {
  namespace DeeGRPC {
    interface ClientMap {}
  }
}

declare namespace DeeGRPC {
  export interface Service extends Dee.Service {
    server?: grpc.Server;
    clients?: ClientMap;
  }

  export interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  export interface Args extends Dee.Args {
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

  export interface ClientMap {
    [k: string]: Client;
  }

  export interface Client extends grpc.Client {
    call: (name: string, args: any, metdata?: grpc.Metadata) => Promise<any>;
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
}

async function DeeGRPC(
  ctx: Dee.ServiceInitializeContext,
  args: DeeGRPC.Args
): Promise<DeeGRPC.Service> {
  const { serverProtoFile, clientProtoFile } = args;
  const srv: DeeGRPC.Service = {};
  if (serverProtoFile) {
    srv.server = await createServer(ctx, args);
  }
  if (serverProtoFile) {
    srv.clients = await createClients(ctx, args);
  }
  return srv;
}

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = "4444";

async function createServer(
  ctx: Dee.ServiceInitializeContext,
  args: DeeGRPC.Args
): Promise<grpc.Server> {
  const {
    serverProtoFile,
    serverHandlers,
    havePermision = () => true,
    serverHost = "127.0.0.1",
    serverPort = "4444"
  } = args;
  const { ns, name } = ctx.srvs.$config;
  const protoRoot = loadProtoFile(serverProtoFile);
  let proto: grpc.GrpcObject;
  try {
    proto = protoRoot[ns][name];
  } catch (err) {
    throw new Error(`no grpc service at ${ns}.${name}`);
  }
  const server = new grpc.Server();
  server.addService(proto.service, shimHandlers(serverHandlers, havePermision));
  // TODO support more credential
  server.bind(
    `${serverHost}:${serverPort}`,
    grpc.ServerCredentials.createInsecure()
  );
  server.start();
  return server;
}

function shimHandlers(
  handlers: DeeGRPC.HandlerFuncMap,
  havePermision: DeeGRPC.CheckPermisionFunc
) {
  let result = {};
  Object.keys(handlers).forEach(id => {
    const fn = handlers[id];
    result[id] = (ctx: DeeGRPC.Context, cb) => {
      const origin = ctx.metadata.get("origin");
      if (!havePermision(String(origin[0]), id)) {
        cb({
          code: grpc.status.PERMISSION_DENIED,
          message: "Permission denied"
        });
        return;
      }
      fn(ctx)
        .then(res => cb(null, res))
        .catch(cb);
    };
  });
  return result;
}

async function createClients(
  ctx: Dee.ServiceInitializeContext,
  args: DeeGRPC.Args
): Promise<DeeGRPC.ClientMap> {
  const clients: DeeGRPC.ClientMap = {};
  const {
    clientProtoFile,
    getClientUri = () => DEFAULT_HOST + ":" + DEFAULT_PORT
  } = args;
  const { ns, name } = ctx.srvs.$config;
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
    client.call = (funcName: string, args: any, metadata?: grpc.Metadata) => {
      if (!metadata) metadata = new grpc.Metadata();
      metadata.add("origin", name);
      const fn = client[funcName];
      const unSupportedRes = {
        message: serviceName + "." + funcName + " is not supported",
        status: grpc.status.UNIMPLEMENTED
      };
      return new Promise((resolve, reject) => {
        if (!fn) return reject(unSupportedRes);
        client[funcName](args, metadata, (err, res) => {
          if (err) return reject(err);
          resolve(res);
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

export = DeeGRPC;