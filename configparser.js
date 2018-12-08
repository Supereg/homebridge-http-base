module.exports = {

    getEmptyUrlObject: function () {
        return {
            url: undefined,
            method: "GET",
            body: "",
            auth: {
                username: undefined,
                password: undefined,
                sendImmediately: true
            },
            headers: {},
            strictSSL: false
        };
    },

    parseUrlProperty: function (property) {
        if (typeof property === "object" && property.constructor === Array)
            throw new Error("property cannot be an array!");

        const array = this.parseMultipleUrlProperty(property);

        return array[0];
    },

    parseMultipleUrlProperty: function (property) {
        let array = [];

        if (typeof property === "object") {
            if (property.constructor === Array) {
                if (property.length === 0)
                    throw new Error("array cannot be empty");

                for (let i = 0; i < property.length; i++) {
                    const element = property[i];

                    try {
                        if (typeof element === "object" && element.constructor === Object) {
                            array.push(this.parseUrlObject(element));
                        }
                        else if (typeof element === "string") {
                            array.push(this.parseStringUrl(element));
                        }
                        else { // noinspection ExceptionCaughtLocallyJS
                            throw new Error(`Wrong data type. Expected string or object"`);
                        }
                    } catch (error) {
                        throw new Error(`error caught on array element at index ${i}: ${error.message}`);
                    }
                }
            }
            else if (property.constructor === Object) {
                array.push(this.parseUrlObject(property)); // TODO accurate error message on throw
            }
        }
        else if (typeof property === "string")
            array.push(this.parseStringUrl(property));
        else
            throw new Error("property has unsupported data type. Expected string or array");

        return array;
    },

    parseStringUrl: function (url) { // can be outsourced
        let urlObject = this.getEmptyUrlObject();
        urlObject.url = url;

        return urlObject;
    },

    parseUrlObject: function (property) {
        if (!property.url)
            throw new Error("undefined 'url' property!");

        if (typeof property.url !== "string")
            throw new Error("'url' must be a string");
        if (property.method && typeof property.method !== "string")
            throw new Error("'method' must be a string!");
        if (property.body && typeof property.body !== "string")
            throw new Error("'body' must be a string!");
        if (property.auth && !(property.auth.username && property.auth.password))
            throw new Error("'auth.username' and/or 'auth.password' was not set!");
        // TODO validate property.headers; ensure it is object with key value pair of strings

        let urlObject = this.getEmptyUrlObject();

        urlObject.url = property.url;

        if (property.method)
            urlObject.method = property.method;

        if (property.body)
            urlObject.body = property.body; // TODO allow body only on certain http methods ?!?

        if (property.auth) {
            urlObject.auth.username = property.auth.username;
            urlObject.auth.password = property.auth.password;

            if (typeof property.auth.sendImmediately === "boolean")
                urlObject.auth.sendImmediately = property.auth.sendImmediately;
        }

        if (property.headers)
            urlObject.headers = property.headers;

        return urlObject
    },

    parseMQTTOptions: function (property) {
        if (typeof property !== "object")
            throw new Error("property has unsupported data type: Expected object!");

        if (typeof property.host !== "string")
            throw new Error("'host' must be a string!");
        if (property.port && typeof property.port !== "number")
            throw new Error("'port' must be a number!");
        if (property.protocol && typeof property.protocol !== "string")
            throw new Error("'protocol' must be a string!");

        if (property.credentials) {
            const credentials = property.credentials;

            if (typeof credentials !== "object")
                throw new Error("'credentials' must be a object!");

            if (!credentials.username)
                throw new Error("'credentials.username' is required when 'credentials' is specified!");

            if (typeof credentials.username !== "string")
                throw new Error("'credentials.username' must be a string!");

            if (credentials.password && typeof credentials.password !== "string")
                throw new Error("'credentials.password' must be a string!");
        }

        if (property.keepalive && typeof property.keepalive !== "number")
            throw new Error("'keepalive' must be a number (in seconds)!");
        if (property.clean && typeof property.clean !== "boolean")
            throw new Error("'clean' must be a boolean!");
        if (property.reconnectPeriod && typeof property.reconnectPeriod !== "number")
            throw new Error("'reconnectPeriod' must be a number (in milliseconds)!");
        if (property.connectTimeout && typeof property.connectTimeout !== "number")
            throw new Error("'connectTimeout' must be a number (in milliseconds)!");


        let mqttOptions = {};

        mqttOptions.host = property.host;
        mqttOptions.port = property.port || 1883;
        mqttOptions.protocol = property.protocol || "mqtt";

        if (property.credentials) {
            mqttOptions.username = property.credentials.username;

            if (property.credentials.password)
                mqttOptions.password = property.credentials.password;
        }

        mqttOptions.keepalive = property.keepalive;
        mqttOptions.clean = property.clean;
        mqttOptions.reconnectPeriod = property.reconnectPeriod;
        mqttOptions.connectTimeout = property.connectTimeout;

        mqttOptions.subscriptions = this.parseMQTTSubscriptions(property.subscriptions);

        return mqttOptions;
    },

    parseMQTTSubscriptions: function (property) {
        if (typeof property !== "object")
            throw new Error("property has unsupported data type. Expected object or array!");

        let mqttSubscriptions = [];

        if (property.constructor === Object) {
            const subscription = this._parseMQTTSubscriptionObject(property); // could throw error
            mqttSubscriptions.push(subscription);
        }
        else if (property.constructor === Array) {
            for (let i = 0; i < property.length; i++) {
                const element = property[i];

                try {
                    const subscription = this._parseMQTTSubscriptionObject(element);
                    mqttSubscriptions.push(subscription);
                } catch (error) {
                    throw new Error(`error caught on array element at index ${i}: ${error.message}`);
                }
            }
        }
        else
            throw new Error("property has unexpected constructor!");

        return mqttSubscriptions;
    },

    _parseMQTTSubscriptionObject: function (property) {
        if (typeof property !== "object")
            throw new Error("subscription entry is not a object!");

        if (!property.topic)
            throw new Error("'subscriptions.topic' is required!");
        if (!property.characteristic)
            throw new Error("'subscriptions.characteristic' is required!");

        if (typeof property.topic !== "string")
            throw new Error("'subscriptions.topic' must be a string!");
        if (typeof property.characteristic !== "string")
            throw new Error("'subscriptions.characteristic' must be a string!");

        if (property.messagePattern && typeof property.messagePattern !== "string")
            throw new Error("'subscriptions.messagePattern' must be a string!");
        if (property.patternGroupToExtract && typeof property.patternGroupToExtract != "number")
            throw new Error("'subscriptions.patternGroupToExtract' must be a number!");

        let subscription = {};
        subscription.topic = property.topic;
        subscription.characteristic = property.characteristic;

        subscription.messagePattern = property.messagePattern;
        subscription.patternGroupToExtract = property.patternGroupToExtract || 1;

        return subscription;
    }

};