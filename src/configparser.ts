import {IClientOptions, QoS} from "mqtt";
import {MQTTSubscription} from "./notifications/mqttClient";

export type Credentials = {
    username?: string,
    password?: string,
    sendImmediately?: boolean
}

export class UrlObject {
    url: string;
    method: string = "GET";
    body: string = "";
    repeat: number = 1;
    delayBeforeExecution: number = 0;
    auth: Credentials = {
        username: undefined,
        password: undefined,
        sendImmediately: true
    };
    headers: Record<string, string> = {};
    strictSSL: boolean = false;
    requestTimeout: number = 20000; // default 20s timeout

    constructor(url: string) {
        this.url = url;
    }
}

export type HeaderKeyValues = {
    key: string,
    value: string,
}

export type MQTTSubscriptionObject = {
    subscriptions: MQTTSubscription[];
}

export class MQTTSubscribeObject {

    topic: string;
    qos: QoS = 0; // TODO should the default be 1?

    messagePattern?: string; // when undefined the whole payload is used as value
    patternGroupToExtract: number = 1; // when non bool characteristic this is used to extract the value of the regex pattern

    constructor(topic: string) {
        this.topic = topic;
    }

}

export class MQTTPublishObject {

    topic: string;
    qos: QoS = 0;
    retain: boolean = false;
    dup?: boolean;

    payloadFormatter?: Function; // function body with argument 'value' to format the mqtt payload message, basically "return value.toString();"

    constructor(topic: string) {
        this.topic = topic;
    }

}

/* ------------------------------------------ */

export function parsePattern(property: any) {
    if (typeof property === "string") {
        return  new RegExp(property);
    } else {
        throw new Error("Unsupported type for pattern");
    }
}

export function parseUrlProperty(property: any) {
    if (typeof property === "object" && property.constructor === Array)
        throw new Error("property cannot be an array!");
    property = property as Partial<UrlObject>;

    const array = parseMultipleUrlProperty(property);
    return array[0];
}

export function parseMultipleUrlProperty(property: any): UrlObject[] {
    let array = [];

    if (typeof property === "string") {
        array.push(new UrlObject(property));
    } else if (typeof property === "object") {
        if (property.constructor === Array) {
            if (property.length === 0)
                throw new Error("array cannot be empty");

            for (let i = 0; i < property.length; i++) {
                const element = property[i];

                try {
                    if (typeof element === "object" && element.constructor === Object) {
                        array.push(_parseUrlObject(element));
                    } else if (typeof element === "string") {
                        array.push(new UrlObject(element));
                    } else { // noinspection ExceptionCaughtLocallyJS
                        throw new Error("Wrong data type. Expected string or object");
                    }
                } catch (error) {
                    throw new Error(`error caught on array element at index ${i}: ${(error as Error).message}`);
                }
            }
        } else if (property.constructor === Object) {
            array.push(_parseUrlObject(property)); // TODO accurate error message on throw
        }
    } else {
        throw new Error("property has an unsupported data type. Expected string, object or array");
    }

    return array;
}

function _parseUrlObject(property: any) {
    if (!property.url)
        throw new Error("undefined 'url' property!");

    if (typeof property.url !== "string")
        throw new Error("'url' must be a string");
    if (property.method !== undefined && typeof property.method !== "string")
        throw new Error("'method' must be a string!");

    if (property.repeat !== undefined && typeof property.repeat !== "number")
        throw new Error("'repeat' must be a number!");
    if (property.delayBeforeExecution !== undefined && typeof property.delayBeforeExecution !== "number")
        throw new Error("'delayBefireExecution' must be a number!");

    if (property.auth !== undefined && !(property.auth.username && property.auth.password))
        throw new Error("'auth.username' and/or 'auth.password' was not set!");
    if (property.headers !== undefined) {
        if (typeof property.headers !== "object") {
            throw new Error("'auth.headers' must be an object");
        }

        if (property.headers.constructor === Object) { // legacy style key value pairs
            const stringOnlyValues = Object.values(property.headers)
                .map(value => typeof value === "string")
                .reduce((prev, cur) => prev && cur);

            if (!stringOnlyValues) {
                throw new Error("'auth.headers' must only contain key-value pairs of type string!");
            }
        } else if (property.headers.constructor === Array) { // object array style (engineered for homebridge config ui)
            const keyValueObjects = property.headers
                .map((pair: HeaderKeyValues) => pair.key !== undefined && pair.value !== undefined)
                .reduce((prev: boolean, cur: boolean) => prev && cur);

            if (!keyValueObjects) {
                throw new Error("'auth.headers' must only contain key-value pairs in proper object format!")
            }
        } else {
            throw new Error("'auth.headers' has unknown constructor");
        }
    }
    if (property.strictSSL !== undefined && typeof property.strictSSL !== "boolean")
        throw new Error("'strictSSL' must be a boolean!");
    if (property.requestTimeout !== undefined && typeof property.requestTimeout !== "number")
        throw new Error("'requestTimeout' must be a number!");

    let urlObject = new UrlObject(property.url);

    if (property.method)
        urlObject.method = property.method;

    if (property.body) {
        // TODO allow body only on certain http methods ?!?
        if (typeof property.body === "string") {
            urlObject.body = property.body;
        } else {
            urlObject.body = JSON.stringify(property.body);
        }
    }

    if (property.repeat)
        urlObject.repeat = Math.max(1, property.repeat);
    if (property.delayBeforeExecution)
        urlObject.delayBeforeExecution = property.delayBeforeExecution;

    if (property.auth) {
        urlObject.auth.username = property.auth.username;
        urlObject.auth.password = property.auth.password;

        if (typeof (property.auth as any).sendImmediately === "boolean")
            urlObject.auth.sendImmediately = property.auth.sendImmediately;
    }

    if (property.headers) {
        if (property.headers.constructor === Array) {
            const headers: Record<string, string> = {};
            property.headers.forEach((pair: HeaderKeyValues) => headers[pair.key] = pair.value);
            urlObject.headers = headers;
        } else {
            urlObject.headers = property.headers;
        }
    }

    if (property.strictSSL)
        urlObject.strictSSL = property.strictSSL;
    if (property.requestTimeout)
        urlObject.requestTimeout = property.requestTimeout;

    return urlObject
}

export function parseMQTTOptions(property: any): IClientOptions & MQTTSubscriptionObject {
    if (typeof property !== "object")
        throw new Error("property has unsupported data type: Expected object!");

    if (typeof property.host !== "string")
        throw new Error("'host' must be a string!");
    if (property.port !== undefined && typeof property.port !== "number")
        throw new Error("'port' must be a number!");
    if (property.protocol !== undefined && typeof property.protocol !== "string")
        throw new Error("'protocol' must be a string!");

    if (property.credentials) {
        const credentials: any = property.credentials;

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
        const will: any = property.will;
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

    let mqttOptions: Partial<IClientOptions & MQTTSubscriptionObject> = {};

    mqttOptions.host = property.host;
    mqttOptions.port = property.port || 1883;
    mqttOptions.protocol = property.protocol || "mqtt";

    if (property.credentials) {
        mqttOptions.username = property.credentials.username;

        if (property.credentials.password)
            mqttOptions.password = property.credentials.password;
    }

    // TODO parse certificates

    mqttOptions.keepalive = property.keepalive;
    mqttOptions.clean = property.clean;
    mqttOptions.reconnectPeriod = property.reconnectPeriod;
    mqttOptions.connectTimeout = property.connectTimeout;
    mqttOptions.clientId = property.clientId;

    mqttOptions.rejectUnauthorized = property.rejectUnauthorized;

    if (property.will !== undefined) {
        mqttOptions.will = {
            topic: property.will.topic as string,
            payload: property.will.payload as string,
            qos: (property.will.qos !== undefined? Math.abs(property.will.qos % 3): 0) as QoS,
            retain: property.will.retain as boolean || false
        };
    }

    if (property.subscriptions) // subscriptions isn't necessary anymore
        mqttOptions.subscriptions = parseMQTTSubscriptions(property.subscriptions);

    return mqttOptions as IClientOptions & MQTTSubscriptionObject;
}

export function parseMQTTSubscriptions(property: any) {
    if (typeof property !== "object")
        throw new Error("property has unsupported data type. Expected object or array!");

    let mqttSubscriptions = [];

    if (property.constructor === Object) {
        const subscription = _parseMQTTSubscriptionObject(property); // could throw error
        mqttSubscriptions.push(subscription);
    } else if (property.constructor === Array) {
        for (let i = 0; i < property.length; i++) {
            const element = property[i];

            try {
                const subscription = _parseMQTTSubscriptionObject(element);
                mqttSubscriptions.push(subscription);
            } catch (error) {
                throw new Error(`error caught on array element at index ${i}: ${(error as Error).message}`);
            }
        }
    } else
        throw new Error("property has unexpected constructor!");

    return mqttSubscriptions;
}

function _parseMQTTSubscriptionObject(property: any) {
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

    let subscription: MQTTSubscription = {
        topic: property.topic,
        characteristic: property.characteristic,
        qos: (property.qos !== undefined? Math.abs(property.qos % 3): 1) as QoS, // 1 is the appropriate default here

        messagePattern: property.messagePattern,
        patternGroupToExtract: property.patternGroupToExtract !== undefined? property.patternGroupToExtract: 1
    };

    return subscription;
}

export function parseMQTTGetTopicProperty(property: any): MQTTSubscribeObject {
    if (typeof property === "string") {
        const subscribeObject = new MQTTSubscribeObject(property);
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

        const subscribeObject = new MQTTSubscribeObject(property.topic);

        subscribeObject.topic = property.topic;
        if (property.qos !== undefined)
            subscribeObject.qos = property.qos;

        subscribeObject.messagePattern = property.messagePattern;
        subscribeObject.patternGroupToExtract = property.patternGroupToExtract !== undefined? property.patternGroupToExtract:  1;

        return subscribeObject;
    } else
        throw new Error("property must be a string or object!");
}

export function parseMQTTSetTopicProperty(property: any) {
    if (typeof property === "object" && property.constructor !== Object)
        throw new Error("property cannot be an array, must be an object!");

    const array = parseMultipleMQTTSetTopicsProperty(property);
    return array[0];
}

export function parseMultipleMQTTSetTopicsProperty(property: any) {
    let array = [];

    if (typeof property === "string") {
        array.push(new MQTTPublishObject(property));
    } else if (typeof property === "object") {
        if (property.constructor === Object) {
            array.push(_parseMQTTSetTopicObject(property));
        } else if (property.constructor === Array) {
            if (property.length === 0)
                throw new Error("array cannot be empty");

            for (let i = 0; i < property.length; i++) {
                const element = property[i];

                try {
                    if (typeof element === "string") {
                        array.push(new MQTTPublishObject(element));
                    } else if (typeof element === "object" && element.constructor === Object) {
                        array.push(_parseMQTTSetTopicObject(element));
                    } else { // noinspection ExceptionCaughtLocallyJS
                        throw new Error("Wrong data type. Expected string or object");
                    }
                } catch (error) {
                    throw new Error(`error caught on array element at index ${i}: ${(error as Error).message}`);
                }
            }
        }
    } else
        throw new Error("property has an unsupported data type. Expected string, object or array");

    return array;
}

function _parseMQTTSetTopicObject(property: any) {
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

    const publishObject = new MQTTPublishObject(property.topic);

    if (property.qos !== undefined)
        publishObject.qos = property.qos;
    publishObject.retain = property.retain;
    publishObject.dup = property.dup;

    if (property.payloadFormatter !== undefined)
        publishObject.payloadFormatter = new Function("value", property.payloadFormatter);

    return publishObject;
}
