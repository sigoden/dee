import { Service, ServiceGroup, ServiceOptions } from "@sigodenjs/dee";
import * as crypto from "crypto";
import * as FastestValidator from "fastest-validator";
import * as nats from "node-nats-streaming";

const validator = new FastestValidator();

export interface NatstreamingService extends Service {
  stan: nats.Stan;
  producers: ProducerMap;
  subscribers: SubscriberMap;
}

export interface NatstreamingServiceOptions extends ServiceOptions {
  args: NatstreamingArgs;
}

interface NatstreamingArgs {
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

interface SubscriberOptions {
  group?: string | boolean;
  durable?: string | boolean;
  noAutoAck: boolean;
  ackWait: number;
  maxInFlight: number;
}

interface HandlerFuncMap {
  [k: string]: HandlerFunc;
}

type HandlerFunc = (ctx: Context) => void;

interface ProducerMap {
  [k: string]: ProduceFunc;
}

type ProduceFunc = (
  msg: any,
  callback?: (err: Error, result?: any) => void
) => Promise<any> | void;

interface SubscriberMap {}

interface Context {
  srvs: ServiceGroup;
}

export default async function init(
  options: NatstreamingServiceOptions
): Promise<NatstreamingService> {
  const { name } = options.srvs.$config;
  const {
    client: clientConfig,
    producers: producersConfig,
    subscribers: subscribersConfig
  } = options.args;
  const clientId = name + "-" + crypto.randomBytes(6).toString("hex");
  const stan = nats.connect(
    clientConfig.clusterId,
    clientId,
    clientConfig.stanOptions
  );
  return new Promise<NatstreamingService>((resolve, reject) => {
    let errorBeforeConnect = true;
    stan.once("connect", () => {
      let producers;
      let subscribers;
      errorBeforeConnect = false;
      if (producersConfig) {
        producers = createProducers(options, stan);
      }
      if (subscribersConfig) {
        subscribers = createSubscribers(options, stan);
      }
      const srv: NatstreamingService = { stan, producers, subscribers };
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
  options: NatstreamingServiceOptions,
  stan: nats.Stan
): ProducerMap {
  const { producers: producersConfig } = options.args;
  const { name } = options.srvs.$config;
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
    const fn = (msg: any, callback?: (err: Error, result?: any) => void) => {
      const ok = check(msg);
      if (!ok) {
        const checkFailError = new Error(
          "validate failed: " + JSON.stringify(msg)
        );
        if (callback) {
          callback(checkFailError);
          return;
        }
        return Promise.reject(checkFailError);
      }
      if (callback) {
        stan.publish(topic, JSON.stringify(msg), check);
        return;
      }
      return new Promise((resolve, reject) => {
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
  options: NatstreamingServiceOptions,
  stan: nats.Stan
): SubscriberMap {
  const { name } = options.srvs.$config;
  const { subscribers: subscribersConfig, handlers } = options.args;
  const subscribers = {};
  Object.keys(subscribersConfig).forEach(subscriberName => {
    const subscriberOptions = subscribersConfig[subscriberName];
    const handler = handlers[subscriberName];
    if (!handler) {
      throw new Error("subscribers." + subscriberName + " have no handler");
    }
    const opts = stan.subscriptionOptions();
    createSubscribeStanOptions(options, opts, subscriberOptions);
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
      msg.srvs = options.srvs;
      handler(msg);
    });
    subscribers[subscriberName] = subscription;
  });
  return subscribers;
}

function createSubscribeStanOptions(
  options: NatstreamingServiceOptions,
  subOpts: nats.SubscriptionOptions,
  config: SubscriberOptions
): void {
  const { name } = options.srvs.$config;
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
