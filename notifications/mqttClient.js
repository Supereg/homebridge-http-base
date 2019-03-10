module.exports = MQTTClient;

const mqttClient = require("mqtt");
const EventEmitter = require("events").EventEmitter;
const util = require("util");
const utils = require("../utils");

util.inherits(MQTTClient, EventEmitter);

function MQTTClient(service, options, log, debug) {
    this.service = service;
    this.mqttOptions = options;
    this.log = log;

    this.debug = debug || false;

    this.subscriptions = {};
    if (options.subscriptions) {
        options.subscriptions.forEach(subscription => {
            this._addSubscription(subscription);
        });
    }

    this.mqttOptions.subscriptions = undefined;
}

MQTTClient.prototype.connect = function () {
    if (Object.keys(this.subscriptions).length === 0) {
        this.log("MQTT no subscriptions specified. MQTT client won't connect");
        return;
    }

    this.log("MQTT connecting to broker...");

    this.client = mqttClient.connect(this.mqttOptions);
    this.client.on("connect", this._connected.bind(this));
    this.client.on("message", this._message.bind(this));
    this.client.on("error", this._error.bind(this));
};

MQTTClient.prototype.end = function (force, closeCallback) {
    if (this.client)
        this.client.end(force, closeCallback);
};

MQTTClient.prototype.subscribe = function (mqttGetTopic, characteristic) {
    this._addSubscription({
        topic: mqttGetTopic.topic,
        characteristic: characteristic,
        qos: mqttGetTopic.topic,
        messagePattern: mqttGetTopic.messagePattern,
        patternGroupToExtract: mqttGetTopic.patternGroupToExtract,
    })
};

MQTTClient.prototype._addSubscription = function (subscription) {
    const characteristicName = subscription.characteristic;
    if (!this.service.testCharacteristic(characteristicName))
        throw new Error("'subscriptions.characteristics' specified an illegal characteristic for this " +
            "service (" + characteristicName + " was specified)!");

    // getCharacteristic would create new characteristic, if it does not exists and is an optional one
    // however we tested above if its there, so this operation is save
    const hapCharacteristic = this.service.getCharacteristic(characteristicName);
    let isBool = typeof hapCharacteristic.getDefaultValue() === "boolean";

    const internalSubscriptionObject = {
        characteristic: characteristicName,
        qos: subscription.qos,
        messagePattern: subscription.messagePattern !== undefined? new RegExp(subscription.messagePattern): undefined,
        patternGroupToExtract: subscription.patternGroupToExtract,
        isBool: isBool,
    };

    if (this.subscriptions.hasOwnProperty(subscription.topic))
        this.subscriptions[subscription.topic].push(internalSubscriptionObject);
    else {
        this.subscriptions[subscription.topic] = [internalSubscriptionObject];
        if (this.client && this.client.connected) {
            this.client.subscribe(subscription.topic, {
                qos: subscription.qos
            }, error => {
                if (error)
                    this.log.error(`MQTT error occurred while subscribing to topic ${topic}: ${error.message}`);
                else
                    this.log(`MQTT successfully subscribed to topic '${topic}'`);
            })
        }
    }
};

MQTTClient.prototype.publish = function (mqttSetTopic, value) {
    let message = value !== undefined? value.toString(): "";
    if (mqttSetTopic.payloadFormatter) {
        try {
            message = mqttSetTopic.payloadFormatter(value);
        } catch (error) {
            this.log.warn(`Error occurred while executing payload formatter for topic ${mqttSetTopic.topic} with value '${value}': ${error.message}`);
            this.log.warn(``);
        }
    }

    this._publish(mqttSetTopic.topic, message, {
      qos: mqttSetTopic.qos,
      retain: mqttSetTopic.retain,
      dup: mqttSetTopic.dup
    })
};

MQTTClient.prototype.multiplePublish = function (mqttSetTopicArray, value) {
    if (mqttSetTopicArray.length === 0)
        throw new Error("Empty mqttSetTopic array");

    mqttSetTopicArray.forEach(mqttSetTopic => {
        this.publish(mqttSetTopic, value);
    })
};

// callback is optional: (error?: Error, packet?: Packet)
MQTTClient.prototype._publish = function (topic, message, options, callback) {
    this.client.publish(topic, message, options || {}, callback || (error => {
        if (error)
            this.log.error(`MQTT error occurred while publishing to topic '${topic}', message '${message}': ${error.message}`);
        else if (this.debug)
            this.log.info(`MQTT successfully published to topic ${topic}`);
    }));
};

MQTTClient.prototype._connected = function () {
    this.log("MQTT Connected!");

    this.emit("connected");

    for (const topic in this.subscriptions) {
        if (!this.subscriptions.hasOwnProperty(topic))
            continue;

        // selecting the first will result in the first subscription on a tropic to be responsible for the qos for all other
        // subscriptions on that same topic. Bit weird but I'm not quite sure how to improve that
        const subscription = this.subscriptions[topic][0];
        this.client.subscribe(topic, {
            qos: subscription.qos
        }, error => {
            if (error)
                this.log.error(`MQTT error occurred while subscribing to topic ${topic}: ${error.message}`);
            else
                this.log(`MQTT successfully subscribed to topic '${topic}'`);
        })
    }
};

MQTTClient.prototype._error = function (error) {
    if (error.message === "Connection refused: Not authorized")
        this.client.end(); // mqtt library would try to reconnect every second

    this.log.error("MQTT error occurred: " + error.message);
    this.emit("error", error);
};

MQTTClient.prototype._message = function (topic, message) {
    const subscriptionArray = this.subscriptions[topic];
    subscriptionArray.forEach(subscription => {
        const pattern = subscription.messagePattern;
        let value = message;

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
            this.emit("message-" + subscription.characteristic, value, utils.once((newValue) => {
                if (newValue !== undefined)
                    value = newValue;

                if (this.debug)
                    this.log(`MQTT updating characteristic ${subscription.characteristic} to ${value}`);
                this.service.getCharacteristic(subscription.characteristic).updateValue(value);
            }), subscription.characteristic);
        } else {
            if (this.debug)
                this.log(`MQTT updating characteristic ${subscription.characteristic} to ${value}`);
            this.service.getCharacteristic(subscription.characteristic).updateValue(value);
        }
    });
};
