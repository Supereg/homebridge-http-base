module.exports = MQTTClient;

const mqttClient = require("mqtt");

function MQTTClient(service, options, log) {
    this.service = service;
    this.mqttOptions = options;
    this.log = log;

    this.subscriptions = {};
    options.subscriptions.forEach(subscription => {
        const characteristicName = subscription.characteristic;
        if (!this.service.testCharacteristic(characteristicName))
            throw new Error("'subscriptions.characteristics' specified an illegal characteristic for this " +
                "service (" + characteristicName + " was specified)!");

        // getCharacteristic would create new characteristic, if it does not exists and is an optional one
        // however we tested above if its there, so this operation is save
        const hapCharacteristic = this.service.getCharacteristic(characteristicName);
        let isBool = typeof hapCharacteristic.getDefaultValue() === "boolean";

        this.subscriptions[subscription.topic] = {
            characteristic: characteristicName,
            qos: subscription.qos,
            messagePattern: subscription.messagePattern? new RegExp(subscription.messagePattern): undefined,
            patternGroupToExtract: subscription.patternGroupToExtract,
            isBool: isBool
        };
    });

    this.mqttOptions.subscriptions = undefined;
}

MQTTClient.prototype = {

    connect() {
        if (Object.keys(this.subscriptions) === 0) {
            this.log("MQTT no subscriptions specified. MQTT client won't connect");
            return;
        }

        this.log("MQTT connecting to broker...");

        this.client = mqttClient.connect(this.mqttOptions);
        this.client.on("connect", this._connected.bind(this));
        this.client.on("message", this._message.bind(this));
        this.client.on("error", this._error.bind(this));
    },

    end(force, closeCallback) {
        if (this.client)
            this.client.end(force, closeCallback);
    },

    _connected: function () {
        this.log("MQTT Connected!");

        for (const topic in this.subscriptions) {
            if (!this.subscriptions.hasOwnProperty(topic))
                continue;

            const subscription = this.subscriptions[topic];
            this.client.subscribe(topic, {
                qos: subscription.qos
            }, error => {
                if (error)
                    this.log.error(`MQTT error occurred while subscribing to topic ${topic}: ${error.message}`);
                else
                    this.log(`MQTT successfully subscribed to topic '${topic}'`);
            })
        }
    },

    _error: function (error) {
        if (error.message === "Connection refused: Not authorized")
            this.client.end(); // mqtt library would try to reconnect every second

        this.error("MQTT error occurred: " + error.message);
    },

    _message: function (topic, message) {
        const data = this.subscriptions[topic];

        const pattern = data.messagePattern;
        let value = message;

        if (pattern) {
            if (data.isBool)
                value = pattern.test(message);
            else {
                const regexMatch = message.match(pattern);

                if (!regexMatch) {
                    this.log.error(`MQTT couldn't extract value with regex pattern (value: '${value}', pattern: '${pattern}')`);
                    return;
                }

                value = regexMatch[data.patternGroupToExtract];
            }
        }

        this.log(`MQTT updating characteristic ${data.characteristic} to ${value}`);
        this.service.getCharacteristic(data.characteristic).updateValue(value);
    }

};