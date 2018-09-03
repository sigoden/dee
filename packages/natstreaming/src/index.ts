import * as Dee from "@sigodenjs/dee";
import * as crypto from "crypto";
import * as FastestValidator from "fastest-validator";
import * as nats from "node-nats-streaming";
import { NatsError } from "nats";

const validator = new FastestValidator();

declare global {
  namespace DeeGRPC {
    interface ProducerMap {}
    interface SubscriberMap {}
  }
}

declare namespace DeeNatstreaming {
  export interface Service extends Dee.Service {
    stan: nats.Stan;
    producers: ProducerMap;
    subscribers: SubscriberMap;
  }

  export interface ServiceOptions extends Dee.ServiceOptions {
    args: Args;
  }

  export interface ProducerMap {
    [k: string]: ProduceFunc;
  }

  export interface SubscriberMap {
    [k: string]: nats.Subscription;
  }

  export interface SubscriberOptions {
    group?: string | boolean;
    durable?: string | boolean;
    noAutoAck?: boolean;
    ackWait?: number;
    maxInFlight?: number;
  }

  export interface Args extends Dee.Args {
    client: ClientOptions;
    handlers?: HandlerFuncMap;
    producers?: ProducerOptionsMap;
    subscribers?: SubscriberOptionsMap;
  }

  interface ClientOptions {
    clusterId: string;
    stanOptions: nats.StanOptions;
  }

  interface ProducerOptionsMap {
    [k: string]: ProducerOptions;
  }

  interface ProducerOptions {
    schema?: any;
  }

  interface SubscriberOptionsMap {
    [k: string]: SubscriberOptions;
  }

  interface HandlerFuncMap {
    [k: string]: HandlerFunc;
  }

  type HandlerFunc = (ctx: Context) => void;

  type ProduceFunc = (msg: any) => Promise<any>;

  interface Context {
    srvs: Dee.ServiceGroup;
    msg: nats.Message;
  }
}

async function DeeNatstreaming(
  ctx: Dee.ServiceInitializeContext,
  args: DeeNatstreaming.Args
): Promise<DeeNatstreaming.Service> {
  const { name } = ctx.srvs.$config;
  const {
    client: clientConfig,
    producers: producersConfig,
    subscribers: subscribersConfig
  } = args;
  const clientId = name + "-" + crypto.randomBytes(6).toString("hex");
  const stan = nats.connect(
    clientConfig.clusterId,
    clientId,
    clientConfig.stanOptions
  );
  return new Promise<DeeNatstreaming.Service>((resolve, reject) => {
    let errorBeforeConnect = true;
    stan.once("connect", () => {
      let producers;
      let subscribers;
      errorBeforeConnect = false;
      if (producersConfig) {
        producers = createProducers(ctx, args, stan);
      }
      if (subscribersConfig) {
        subscribers = createSubscribers(ctx, args, stan);
      }
      const srv: DeeNatstreaming.Service = { stan, producers, subscribers };
      resolve(srv);
      return;
    });
    stan.once("error", err => {
      if (errorBeforeConnect) {
        reject(err);
        return;
      }
    });
  });
}

function createProducers(
  ctx: Dee.ServiceInitializeContext,
  args: DeeNatstreaming.Args,
  stan: nats.Stan
): DeeNatstreaming.ProducerMap {
  const { producers: producersConfig } = args;
  const { name } = ctx.srvs.$config;
  const producers = {};
  Object.keys(producersConfig).forEach(producerName => {
    const topic = name + "." + producerName;
    const producerOptions = producersConfig[producerName];
    let check: (data: any) => boolean = () => true;
    if (producerOptions.schema) {
      try {
        check = validator.compile(producerOptions.schema);
      } catch (err) {
        throw new Error("producers." + topic + ".schema is invalid");
      }
    }
    const fn = (msg: any) => {
      return new Promise((resolve, reject) => {
        const ok = check(msg);
        const checkFailError = new Error(
          "validate failed: " + JSON.stringify(msg)
        );
        if (!ok) return reject(checkFailError);
        stan.publish(topic, JSON.stringify(msg), (err, data) => {
          if (err) {
            return reject(err);
          }
          return resolve(data);
        });
      });
    };
    producers[producerName] = fn;
  });
  return producers;
}

function createSubscribers(
  ctx: Dee.ServiceInitializeContext,
  args: DeeNatstreaming.Args,
  stan: nats.Stan
): DeeNatstreaming.SubscriberMap {
  const { name } = ctx.srvs.$config;
  const { subscribers: subscribersConfig, handlers } = args;
  const subscribers = {};
  Object.keys(subscribersConfig).forEach(subscriberName => {
    const subscriberOptions = subscribersConfig[subscriberName];
    const handler = handlers[subscriberName];
    if (!handler) {
      throw new Error("subscribers." + subscriberName + " have no handler");
    }
    const opts = stan.subscriptionOptions();
    createSubscribeStanOptions(ctx, opts, subscriberOptions);
    let group = null;
    if (subscriberOptions.group) {
      if (typeof subscriberOptions.group === "boolean") {
        group = name;
      } else {
        group = subscriberOptions.group;
      }
    }
    const subscription = stan.subscribe(subscriberName, group, opts);
    subscription.on("message", msg => {
      const c = { msg, srvs: ctx.srvs };
      handler(c);
    });
    subscribers[subscriberName] = subscription;
  });
  return subscribers;
}

function createSubscribeStanOptions(
  ctx: Dee.ServiceInitializeContext,
  subOpts: nats.SubscriptionOptions,
  config: DeeNatstreaming.SubscriberOptions
): void {
  const { name } = ctx.srvs.$config;
  const { noAutoAck, ackWait, maxInFlight } = config;
  let { durable } = config;
  subOpts.setStartWithLastReceived();
  if (durable) {
    if (typeof durable === "boolean") {
      durable = name;
    }
  }
  subOpts.setDurableName(String(durable));
  if (!noAutoAck) {
    subOpts.setManualAckMode(true);
    if (ackWait) {
      subOpts.setAckWait(ackWait * 1000);
    }
  }
  if (maxInFlight) {
    subOpts.setMaxInFlight(maxInFlight);
  }
}

export = DeeNatstreaming;
