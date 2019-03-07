module.exports = {

    getEmptyUrlObject: function () {
        return {
            url: undefined,
            method: "GET",
            body: "",
            repeat: 1,
            delayBeforeExecution: 0,
            auth: {
                username: undefined,
                password: undefined,
                sendImmediately: true
            },
            headers: {},
            strictSSL: false,
            requestTimeout: 20000, // default 20s timeout
        };
    },

    getEmptyMQTTSubscribeObject: function () {
        return {
            topic: undefined,
            qos: 0, // TODO should the default be 1?

            messagePattern: undefined, // when undefined the whole payload is used as value
            patternGroupToExtract: undefined, // when non bool characteristic this is used to extract the value of the regex pattern
        }
    },

    getEmptyMQTTPublishObject: function () {
        return {
            topic: undefined,
            qos: 0,
            retain: false,
            dup: undefined,

            payloadFormatter: undefined, // function body with argument 'value' to format the mqtt payload message, basically "return value.toString();"
        }
    },

    parsePattern: function (property) {
        if (typeof property === "string")
            return  new RegExp(property);
        else
            throw new Error("Unsupported type for pattern");
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
                            array.push(this._parseUrlObject(element));
                        } else if (typeof element === "string") {
                            array.push(this._parseStringUrl(element));
                        } else { // noinspection ExceptionCaughtLocallyJS
                            throw new Error("Wrong data type. Expected string or object");
                        }
                    } catch (error) {
                        throw new Error(`error caught on array element at index ${i}: ${error.message}`);
                    }
                }
            } else if (property.constructor === Object) {
                array.push(this._parseUrlObject(property)); // TODO accurate error message on throw
            }
        } else if (typeof property === "string")
            array.push(this._parseStringUrl(property));
        else
            throw new Error("property has an unsupported data type. Expected string, object or array");

        return array;
    },

    _parseStringUrl: function (url) { // can be outsourced
        let urlObject = this.getEmptyUrlObject();
        urlObject.url = url;

        return urlObject;
    },

    _parseUrlObject: function (property) {
        if (!property.url)
            throw new Error("undefined 'url' property!");

        if (typeof property.url !== "string")
            throw new Error("'url' must be a string");
        if (property.method !== undefined && typeof property.method !== "string")
            throw new Error("'method' must be a string!");
        if (property.body !== undefined && typeof property.body !== "string")
            throw new Error("'body' must be a string!");

        if (property.repeat !== undefined && typeof property.repeat !== "number")
            throw new Error("'repeat' must be a number!");
        if (property.delayBeforeExecution !== undefined && typeof property.delayBeforeExecution !== "number")
            throw new Error("'delayBefireExecution' must be a number!");

        if (property.auth !== undefined && !(property.auth.username && property.auth.password))
            throw new Error("'auth.username' and/or 'auth.password' was not set!");
        // TODO validate property.headers; ensure it is object with key value pair of strings
        if (property.strictSSL !== undefined && typeof property.strictSSL !== "boolean")
            throw new Error("'strictSSL' must be a boolean!");
        if (property.requestTimeout !== undefined && typeof property.requestTimeout !== "number")
            throw new Error("'requestTimeout' must be a number!");

        let urlObject = this.getEmptyUrlObject();

        urlObject.url = property.url;

        if (property.method)
            urlObject.method = property.method;

        if (property.body)
            urlObject.body = property.body; // TODO allow body only on certain http methods ?!?

        if (property.repeat)
            urlObject.repeat = Math.max(1, property.repeat);
        if (property.delayBeforeExecution)
            urlObject.delayBeforeExecution = property.delayBeforeExecution;

        if (property.auth) {
            urlObject.auth.username = property.auth.username;
            urlObject.auth.password = property.auth.password;

            if (typeof property.auth.sendImmediately === "boolean")
                urlObject.auth.sendImmediately = property.auth.sendImmediately;
        }

        if (property.headers)
            urlObject.headers = property.headers;

        if (property.strictSSL)
            urlObject.strictSSL = property.strictSSL;
        if (property.requestTimeout)
            urlObject.requestTimeout = property.requestTimeout;

        return urlObject
    },

    parseMQTTOptions: function (property) {
        if (typeof property !== "object")
            throw new Error("property has unsupported data type: Expected object!");

        if (typeof property.host !== "string")
            throw new Error("'host' must be a string!");
        if (property.port !== undefined && typeof property.port !== "number")
            throw new Error("'port' must be a number!");
        if (property.protocol !== undefined && typeof property.protocol !== "string")
            throw new Error("'protocol' must be a string!");

        if (property.credentials) {
            const credentials = property.credentials;

            if (typeof credentials !== "object")
                throw new Error("'credentials' must be an object!");

            if (credentials.username === undefined)
                throw new Error("'credentials.username' is required when 'credentials' is specified!");

            if (typeof credentials.username !== "string")
                throw new Error("'credentials.username' must be a string!");

            if (credentials.password !== undefined && typeof credentials.password !== "string")
                throw new Error("'credentials.password' must be a string!");
        }

        if (property.keepalive !== undefined && typeof property.keepalive !== "number")
            throw new Error("'keepalive' must be a number (in seconds)!");
        if (property.clean !== undefined && typeof property.clean !== "boolean")
            throw new Error("'clean' must be a boolean!");
        if (property.reconnectPeriod !== undefined && typeof property.reconnectPeriod !== "number")
            throw new Error("'reconnectPeriod' must be a number (in milliseconds)!");
        if (property.connectTimeout !== undefined && typeof property.connectTimeout !== "number")
            throw new Error("'connectTimeout' must be a number (in milliseconds)!");
        if (property.clientId !== undefined && typeof property.clientId !== "string")
            throw new Error("'clientId' must be a string!");

        if (property.rejectUnauthorized !== undefined && typeof property.rejectUnauthorized !== "boolean")
            throw new Error("'rejectUnauthorized' must be a boolean!");

        if (property.will !== undefined) {
            const will = property.will;
            if (typeof will !== "object")
                throw new Error("'will' must be an object!");

            if (will.topic === undefined)
                throw new Error("'will.topic' is required when 'will' is specified!");
            if (will.payload === undefined)
                throw new Error("'will.payload' is required when 'will' is specified!");

            if (typeof will.topic !== "string")
                throw new Error("'will.topic' must be a string!");
            if (typeof will.payload !== "string")
                throw new Error("'will.payload' must be string!");

            if (will.qos !== undefined && typeof will.qos !== "number")
                throw new Error("'will.qos' must be a number!");
            if (will.retain !== undefined && typeof will.retain !== "boolean")
                throw new Error("'will.retain' must be a boolean!");
        }

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
        mqttOptions.clientId = property.clientId;

        mqttOptions.rejectUnauthorized = property.rejectUnauthorized;

        if (property.will !== undefined) {
            mqttOptions.will = {};

            mqttOptions.will.topic = property.will.topic;
            mqttOptions.will.payload = property.will.payload;

            mqttOptions.will.qos = property.will.qos !== undefined? Math.abs(property.will.qos % 3): 0;
            mqttOptions.will.retain = property.will.retain || false;
        }

        if (property.subscriptions) // subscriptions isn't necessary anymore
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
        } else if (property.constructor === Array) {
            for (let i = 0; i < property.length; i++) {
                const element = property[i];

                try {
                    const subscription = this._parseMQTTSubscriptionObject(element);
                    mqttSubscriptions.push(subscription);
                } catch (error) {
                    throw new Error(`error caught on array element at index ${i}: ${error.message}`);
                }
            }
        } else
            throw new Error("property has unexpected constructor!");

        return mqttSubscriptions;
    },

    _parseMQTTSubscriptionObject: function (property) {
        if (typeof property !== "object")
            throw new Error("subscription entry is not a object!");

        if (property.topic === undefined)
            throw new Error("'subscriptions.topic' is required!");
        if (property.characteristic === undefined)
            throw new Error("'subscriptions.characteristic' is required!");

        if (typeof property.topic !== "string")
            throw new Error("'subscriptions.topic' must be a string!");
        if (typeof property.characteristic !== "string")
            throw new Error("'subscriptions.characteristic' must be a string!");

        if (property.qos !== undefined && typeof property.qos !== "number")
            throw new Error("'subscriptions.characteristic' must be a number!");
        if (property.messagePattern !== undefined && typeof property.messagePattern !== "string")
            throw new Error("'subscriptions.messagePattern' must be a string!");
        if (property.patternGroupToExtract !== undefined && typeof property.patternGroupToExtract != "number")
            throw new Error("'subscriptions.patternGroupToExtract' must be a number!");

        let subscription = {};
        subscription.topic = property.topic;
        subscription.characteristic = property.characteristic;
        subscription.qos = property.qos !== undefined? Math.abs(property.qos % 3): 1; // 1 is the appropriate default here

        subscription.messagePattern = property.messagePattern;
        subscription.patternGroupToExtract = property.patternGroupToExtract !== undefined? property.patternGroupToExtract:  1;

        return subscription;
    },

    parseMQTTGetTopicProperty: function (property) {
        if (typeof property === "string") {
            const subscribeObject = this.getEmptyMQTTSubscribeObject();
            subscribeObject.topic = property;
            return subscribeObject;
        } else if (typeof property === "object") {
            if (property.constructor !== Object)
                throw new Error("property cannot be an array!");

            if (property.topic === undefined)
                throw new Error("'topic' is required!");

            if (typeof property.topic !== "string")
                throw new Error("'topic' must be a string!");

            if (property.qos !== undefined && typeof property.qos !== "number")
                throw new Error("'qos' must be a number!");
            if (property.messagePattern !== undefined && typeof property.messagePattern !== "string")
                throw new Error("'subscriptions.messagePattern' must be a string!");
            if (property.patternGroupToExtract !== undefined && typeof property.patternGroupToExtract != "number")
                throw new Error("'subscriptions.patternGroupToExtract' must be a number!");

            const subscribeObject = this.getEmptyMQTTSubscribeObject();

            subscribeObject.topic = property.topic;
            if (property.qos !== undefined)
                subscribeObject.qos = property.qos;

            subscribeObject.messagePattern = property.messagePattern;
            subscribeObject.patternGroupToExtract = property.patternGroupToExtract;

            return subscribeObject;
        } else
            throw new Error("property must be a string or object!");
    },

    parseMQTTSetTopicProperty: function (property) {
        if (typeof property === "object" && property.constructor === Array)
            throw new Error("property cannot be an array, must be an object!");

        const array = this.parseMultipleMQTTSetTopicsProperty(property);
        return array[0];
    },

    parseMultipleMQTTSetTopicsProperty: function (property) {
        let array = [];

        if (typeof property === "string") {
            array.push(this._parseMQTTSetTopicString(property));
        } else if (typeof property === "object") {
            if (property.constructor === Object) {
                array.push(this._parseMQTTSetTopicObject(property));
            } else if (property.constructor === Array) {
                if (property.length() === 0)
                    throw new Error("array cannot be empty");

                for (let i = 0; i < property.length; i++) {
                    const element = property[i];

                    try {
                        if (typeof element === "string") {
                            array.push(this._parseMQTTSetTopicString(element));
                        } else if (typeof element === "object" && element.constructor === Object) {
                            array.push(this._parseMQTTSetTopicObject(element));
                        } else { // noinspection ExceptionCaughtLocallyJS
                            throw new Error("Wrong data type. Expected string or object");
                        }
                    } catch (error) {
                        throw new Error(`error caught on array element at index ${i}: ${error.message}`);
                    }
                }
            }
        } else
            throw new Error("property has an unsupported data type. Expected string, object or array");

        return array;
    },

    _parseMQTTSetTopicString: function (property) {
        const publishObject = this.getEmptyMQTTPublishObject();
        publishObject.topic = property;
        return publishObject;
    },

    _parseMQTTSetTopicObject: function (property) {
        if (property.topic === undefined)
            throw new Error("'topic' is required!");

        if (typeof property.topic !== "string")
            throw new Error("'topic' must be a string!");

        if (property.qos !== undefined && typeof property.qos !== "number")
            throw new Error("'qos' must be a number!");

        if (property.retain !== undefined && typeof property.retain !== "boolean")
            throw new Error("'boolean' must be a boolean!");
        if (property.dup !== undefined && typeof property.dup !== "boolean")
            throw new Error("'dup' must be a boolean!");

        if (property.payloadFormatter !== undefined && typeof property.payloadFormatter !== "string")
            throw new Error("'payloadFormatter' must be a string!");

        const publishObject = this.getEmptyMQTTPublishObject();

        publishObject.topic = topic;
        if (property.qos !== undefined)
            publishObject.qos = property.qos;
        publishObject.retain = property.retain;
        publishObject.dup = property.dup;

        if (property.payloadFormatter !== undefined)
            publishObject.payloadFormatter = new Function("value", property.payloadFormatter);

        return publishObject;
    }

};
