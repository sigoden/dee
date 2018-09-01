import * as nats from "node-nats-streaming";
import * as crypto from "crypto";
import { Service, ServiceOptions, ServiceGroup } from "@sigodenjs/dee";
import * as FastestValidator from "fastest-validator";

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
  let { name } = options.srvs.$config;
  let {
    client: clientConfig,
    producers: producersConfig,
    subscribers: subscribersConfig
  } = options.args;
  let clientId = name + "-" + crypto.randomBytes(6).toString("hex");
  let stan = nats.connect(
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
      let srv: NatstreamingService = { stan, producers, subscribers };
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
  let { producers: producersConfig } = options.args;
  let { name } = options.srvs.$config;
  let producers = {};
  for (let producerName in producersConfig) {
    let topic = name + "." + producerName;
    let producerOptions = producersConfig[producerName];
    let check: (data: any) => boolean = () => true;
    if (producerOptions.schema) {
      try {
        check = validator.compile(producerOptions.schema);
      } catch (err) {
        throw new Error("producers." + topic + ".schema is invalid");
      }
    }
    let fn = (msg: any, callback?: (err: Error, result?: any) => void) => {
      let ok = check(msg);
      if (!ok) {
        let checkFailError = new Error(
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
          if (err) return reject(err);
          return resolve(data);
        });
      });
    };
    producers[producerName] = fn;
  }
  return producers;
}

function createSubscribers(
  options: NatstreamingServiceOptions,
  stan: nats.Stan
): SubscriberMap {
  let { name } = options.srvs.$config;
  let { subscribers: subscribersConfig, handlers } = options.args;
  let subscribers = {};
  for (let subscriberName in subscribersConfig) {
    let subscriberOptions = subscribersConfig[subscriberName];
    let handler = handlers[subscriberName];
    if (!handler) {
      throw new Error("subscribers." + subscriberName + " have no handler");
    }
    let opts = stan.subscriptionOptions();
    createSubscribeStanOptions(options, opts, subscriberOptions);
    let group = null;
    if (subscriberOptions.group) {
      if (typeof subscriberOptions.group === "boolean") {
        group = name;
      } else {
        group = subscriberOptions.group;
      }
    }
    let subscription = stan.subscribe(subscriberName, group, opts);
    subscription.on("message", msg => {
      msg.srvs = options.srvs;
      handler(msg);
    });
    subscribers[subscriberName] = subscription;
  }
  return subscribers;
}

function createSubscribeStanOptions(
  options: NatstreamingServiceOptions,
  subOpts: nats.SubscriptionOptions,
  config: SubscriberOptions
): void {
  let { name } = options.srvs.$config;
  let { durable, noAutoAck, ackWait, maxInFlight } = config;
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
