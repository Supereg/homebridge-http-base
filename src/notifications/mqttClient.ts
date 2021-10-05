import {Formats, Service} from "hap-nodejs";
import {
    CloseCallback,
    MqttClient,
    QoS,
    Packet,
    IConnackPacket,
    IClientPublishOptions,
    PacketCallback,
    IClientOptions
} from "mqtt";
import {utils} from "../index";
import {MQTTPublishObject, MQTTSubscribeObject, MQTTSubscriptionObject} from "../configparser";
import {EventEmitter} from "events";
const mqttClient = require('mqtt');

export type MQTTSubscription = {
    topic: string
    characteristic: string,
    qos: QoS,

    messagePattern?: string,
    patternGroupToExtract: number
}

type InternalMQTTSubscription = {
    characteristic: string,
    qos: QoS,
    messagePattern?: RegExp,
    patternGroupToExtract: number,
    isBool: boolean,
}

export class MQTTClient extends EventEmitter {

    service: Service;
    mqttOptions: IClientOptions;
    log: any;
    debug: boolean;

    subscriptions: Record<string, InternalMQTTSubscription[]>;
    client?: MqttClient;

    constructor(service: Service, options: IClientOptions & MQTTSubscriptionObject, log: any, debug?: boolean) {
        super();
        this.service = service;
        this.mqttOptions = options;
        this.log = log;
        this.debug = debug || false;

        this.subscriptions = {};
        if (options.subscriptions) {
            options.subscriptions.forEach((subscription: MQTTSubscription) => {
                this._addSubscription(subscription);
            });
        }
        (options as any).subscriptions = undefined;
    }

    connect() {
        this.log("MQTT connecting to broker...");

        this.client = mqttClient.connect(this.mqttOptions);
        this.client!.on("connect", this._connected.bind(this));
        this.client!.on("message", this._message.bind(this));
        this.client!.on("error", this._error.bind(this));
        this.client!.on("close", () => this.log("MQTT client disconnected!"));
    }

    end(force: boolean, closeCallback: CloseCallback) {
        if (this.client)
            this.client.end(force, closeCallback);
    }

    subscribe(mqttGetTopic: MQTTSubscribeObject, characteristic: string) {
        this._addSubscription({
            topic: mqttGetTopic.topic,
            characteristic: characteristic,
            qos: mqttGetTopic.qos || 0,
            messagePattern: mqttGetTopic.messagePattern,
            patternGroupToExtract: mqttGetTopic.patternGroupToExtract,
        })
    }

    _addSubscription(subscription: MQTTSubscription) {
        const characteristicName = subscription.characteristic;
        if (!utils.testCharacteristic(this.service, characteristicName))
            throw new Error("'subscriptions.characteristics' specified an illegal characteristic for this " +
                "service (" + characteristicName + " was specified)!");

        // getCharacteristic would create new characteristic, if it does not exists and is an optional one
        // however we tested above if its there, so this operation is save
        const hapCharacteristic = utils.getCharacteristic(this.service, characteristicName)!;
        let isBool = hapCharacteristic.props.format === Formats.BOOL;

        const internalSubscriptionObject: InternalMQTTSubscription = {
            characteristic: characteristicName,
            qos: subscription.qos,
            messagePattern: subscription.messagePattern !== undefined? new RegExp(subscription.messagePattern): undefined,
            patternGroupToExtract: subscription.patternGroupToExtract,
            isBool: isBool,
        };

        if (this.subscriptions.hasOwnProperty(subscription.topic)) {
            this.subscriptions[subscription.topic].push(internalSubscriptionObject);
        } else {
            this.subscriptions[subscription.topic] = [internalSubscriptionObject];
            if (this.client && this.client.connected) {
                this.client.subscribe(subscription.topic, {
                    qos: subscription.qos
                }, (error, granted) => {
                    if (error)
                        this.log.error(`MQTT error occurred while subscribing to topic ${subscription.topic}: ${error.message}`);
                    else
                        this.log(`MQTT successfully subscribed to topic '${subscription.topic}. Granted ${JSON.stringify(granted)}'`);
                });
            }
        }
    }

    publish(mqttSetTopic: MQTTPublishObject, value: string, callback?: PacketCallback) {
        let message = value !== undefined? value.toString(): "";
        if (mqttSetTopic.payloadFormatter) {
            try {
                message = mqttSetTopic.payloadFormatter(value);
            } catch (error) {
                this.log.warn(`Error occurred while executing payload formatter for topic ${mqttSetTopic.topic} with value '${value}': ${(error as Error).message}`);
                this.log.warn(``);
            }
        }

        this._publish(mqttSetTopic.topic, message, {
            qos: mqttSetTopic.qos,
            retain: mqttSetTopic.retain,
            dup: mqttSetTopic.dup
        }, callback);
    }

    multiplePublish(mqttSetTopicArray: MQTTPublishObject[], value: string) {
        if (mqttSetTopicArray.length === 0)
            throw new Error("Empty mqttSetTopic array");

        // TODO execute with async to add support for a callback which is called when all publish was executed on all topics
        mqttSetTopicArray.forEach((mqttSetTopic: MQTTPublishObject) => {
            this.publish(mqttSetTopic, value);
        });
    }

    _publish(topic: string, message: string, options: IClientPublishOptions, callback?: PacketCallback) {
        this.client!.publish(topic, message, options || {}, callback || ((error?: Error) => {
            if (error) {
                this.log.error(`MQTT error occurred while publishing to topic '${topic}', message '${message}': ${error.message}`);
            } else if (this.debug) {
                this.log.info(`MQTT successfully published to topic ${topic}`);
            }
        }));
    }

    _connected (connack: IConnackPacket) {
        this.log("MQTT Connected!");

        /** @namespace connack.sessionPresent */
        if (!connack.sessionPresent) {
            for (const topic in this.subscriptions) {
                if (!this.subscriptions.hasOwnProperty(topic))
                    continue;

                // selecting the first will result in the first subscription on a tropic to be responsible for the qos for all other
                // subscriptions on that same topic. Bit weird but I'm not quite sure how to improve that
                const subscription = this.subscriptions[topic][0];
                this.log("Subscribing to existing topic: " + topic); // TODO remove
                this.client!.subscribe(topic, {
                    qos: subscription.qos
                }, (error, granted) => {
                    if (error)
                        this.log.error(`MQTT error occurred while subscribing to topic ${topic}: ${error.message}`);
                    else
                        this.log(`MQTT successfully subscribed to topic '${topic}. Granted ${JSON.stringify(granted)}'`);
                })
            }
        }

        this.emit("connected");
    }

    _error(error: Error) {
        if (error.message === "Connection refused: Not authorized")
            this.client!.end(); // mqtt library would try to reconnect every second

        this.log.error("MQTT error occurred: " + error.message);
        this.emit("error", error);
    }

    _message(topic: string, payload: Buffer, packet: Packet) {
        const message = payload.toString();

        const subscriptionArray = this.subscriptions[topic];
        subscriptionArray.forEach(subscription => {
            const pattern = subscription.messagePattern;
            let value: any = message;

            if (pattern) {
                if (subscription.isBool)
                    value = pattern.test(message);
                else {
                    const regexMatch = message.match(pattern);

                    if (!regexMatch) {
                        this.log.error(`MQTT couldn't extract value with regex pattern (value: '${value}', pattern: '${pattern}')`);
                        return;
                    }
                    if (subscription.patternGroupToExtract >= regexMatch.length) {
                        this.log.error("MQTT the specified group from which the data should be extracted was out of bounds");
                        return;
                    }

                    value = regexMatch[subscription.patternGroupToExtract];
                }
            }

            if (this.listeners("message-" + subscription.characteristic).length > 0) {
                this.emit("message-" + subscription.characteristic, value, utils.once((newValue: any) => {
                    if (newValue !== undefined)
                        value = newValue;

                    if (this.debug)
                        this.log(`MQTT updating characteristic ${subscription.characteristic} to ${value}`);
                    this.service.getCharacteristic(subscription.characteristic)!.updateValue(value);
                }), subscription.characteristic);
            } else {
                if (this.debug)
                    this.log(`MQTT updating characteristic ${subscription.characteristic} to ${value}`);
                this.service.getCharacteristic(subscription.characteristic)!.updateValue(value);
            }
        });
    }

}
