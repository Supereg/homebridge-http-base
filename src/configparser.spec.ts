import * as configParser from './configparser';

describe("Config Parser", function () {
    describe("URL parser", function () {
        it('should parse simple string url', function () {
            const url = "http://localhost:8080";
            const urlObject = configParser.parseUrlProperty(url);
            expect(urlObject.url).toEqual(url);
        });
        it('should reject illegal data type', function () {
            const url = 1238123;
            expect(() => configParser.parseUrlProperty(url)).toThrow("property has an unsupported data type. Expected string, object or array");
        });
        it('should reject array passed to #parseUrlProperty', function () {
            const url = ["https://localhost:8080"];
            expect(() => configParser.parseUrlProperty(url)).toThrow("property cannot be an array!");
        });

        it('should parse simple array of urls', function () {
            const urls = ["https://localhost:8080", "https://localhost:8081"];
            const urlObjects = configParser.parseMultipleUrlProperty(urls);
            expect(urlObjects.constructor).toEqual(Array);
            expect(urlObjects[0].url).toEqual("https://localhost:8080");
            expect(urlObjects[1].url).toEqual("https://localhost:8081");
        });
        it('should reject illegal data type in array', function () {
            const urls = ["https://localhost:8080", 1237123];
            expect(() => configParser.parseMultipleUrlProperty(urls)).toThrow("Wrong data type. Expected string or object");
        });
        it('should reject empty array', function () {
            const urls: any = [];
            expect(() => configParser.parseMultipleUrlProperty(urls)).toThrow("array cannot be empty");
        });

        it('should parse simple urlObject', function () {
            const configObject = {
                url: "https://localhost:8080"
            };
            const urlObject = configParser.parseUrlProperty(configObject);
            expect(urlObject.url).toEqual("https://localhost:8080");
        });
        it('should parse simple array of urlObjects', function () {
            const configObjects = [
                {
                    url: "https://localhost:8080"
                },
                {
                    url: "https://localhost:8081"
                }
            ];
            const urlObjects = configParser.parseMultipleUrlProperty(configObjects);
            expect(urlObjects.constructor).toEqual(Array);
            expect(urlObjects[0].url).toEqual("https://localhost:8080");
            expect(urlObjects[1].url).toEqual("https://localhost:8081");
        });

        it('should parse maxed out urlObject', function () {
            const object = {
                url: "https://localhost:8080",
                method: "POST",
                body: "foo",
                repeat: -1, // should reject negative values and correct them
                delayBeforeExecution: 100,
                auth: {
                    username: "admin",
                    password: "123456",
                    sendImmediately: true
                },
                headers: {
                    "Content-Type": "text/html",
                    "Content-Encoding": "gzip"
                },
                strictSSL: true,
                requestTimeout: 1234
            };
            const urlObject = configParser.parseUrlProperty(object);
            expect(urlObject.url).toEqual(object.url);
            expect(urlObject.method).toEqual(object.method);
            expect(urlObject.body).toEqual(object.body);
            expect(urlObject.repeat).toEqual(1);
            expect(urlObject.delayBeforeExecution).toEqual(object.delayBeforeExecution);
            expect(urlObject.auth.username).toEqual(object.auth.username);
            expect(urlObject.auth.password).toEqual(object.auth.password);
            expect(urlObject.auth.sendImmediately).toEqual(object.auth.sendImmediately);
            expect(urlObject.headers["Content-Type"]).toEqual("text/html");
            expect(urlObject.headers["Content-Encoding"]).toEqual("gzip");
            expect(urlObject.strictSSL).toEqual(object.strictSSL);
            expect(urlObject.requestTimeout).toEqual(object.requestTimeout);
        });

        it('should accept object as body property', function () {
            const object = {
                url: "https://google.com",
                method: "POST",
                body: {
                    here: "is a string",
                    and: ["a", {nested: "object"}]
                }
            };

            const urlObject = configParser.parseUrlProperty(object);
            expect(typeof urlObject.body).toEqual("string");
            expect(urlObject.body).toEqual('{"here":"is a string","and":["a",{"nested":"object"}]}');
        });

        it('should properly convert key-value objects passed to headers', function () {
            const object = {
                url: "https://google.com",
                headers: [
                    {
                        "key": "Content-Type",
                        "value": "text/html"
                    },
                    {
                        "key": "Content-Encoding",
                        "value": "gzip"
                    }
                ]
            };

            const urlObject = configParser.parseUrlProperty(object);
            expect(urlObject.headers["Content-Type"]).toEqual("text/html");
            expect(urlObject.headers["Content-Encoding"]).toEqual("gzip");
        });

        // TODO add test cases to ensure illegal data types for urlObject fields get rejected
    });

    describe("MQTT parser", function () {
        it('should parse maxed out mqtt options object', function () {
            const mqttObject = {
                host: "localhost",
                port: 1234,
                protocol: "smqtt",
                credentials: {
                    username: "admin",
                    password: "123456"
                },
                keepalive: 1000,
                clean: true,
                reconnectPeriod: 10000,
                connectTimeout: 100,
                clientId: "mqttId",
                rejectUnauthorized: true,
                will: {
                    topic: "last will",
                    payload: "message",
                    qos: 2,
                    retain: true
                },
                subscriptions: [
                    {
                        topic: "testTopic",
                        characteristic: "On",
                        qos: 3,
                        messagePattern: "true",
                        patternGroupToExtract: 1
                    }
                ]
            };
            const mqttOptions = configParser.parseMQTTOptions(mqttObject);
            expect(mqttOptions.host).toEqual(mqttObject.host);
            expect(mqttOptions.port).toEqual(mqttObject.port);
            expect(mqttOptions.protocol).toEqual(mqttObject.protocol);
            expect(mqttOptions.username).toEqual(mqttObject.credentials.username);
            expect(mqttOptions.password).toEqual(mqttObject.credentials.password);
            expect(mqttOptions.keepalive).toEqual(mqttObject.keepalive);
            expect(mqttOptions.clean).toEqual(mqttObject.clean);
            expect(mqttOptions.reconnectPeriod).toEqual(mqttObject.reconnectPeriod);
            expect(mqttOptions.connectTimeout).toEqual(mqttObject.connectTimeout);
            expect(mqttOptions.clientId).toEqual(mqttObject.clientId);
            expect(mqttOptions.rejectUnauthorized).toEqual(mqttObject.rejectUnauthorized);
            expect(mqttOptions.will).not.toBeUndefined();
            expect(mqttOptions.will!.topic).toEqual(mqttObject.will.topic);
            expect(mqttOptions.will!.payload).toEqual(mqttObject.will.payload);
            expect(mqttOptions.will!.qos).toEqual(mqttObject.will.qos);
            expect(mqttOptions.will!.retain).toEqual(mqttObject.will.retain);

            const subscription = mqttOptions.subscriptions[0];
            expect(subscription.topic).toEqual("testTopic");
            expect(subscription.characteristic).toEqual("On");
            expect(subscription.qos).toEqual(0);
            expect(subscription.messagePattern).toEqual("true");
            expect(subscription.patternGroupToExtract).toEqual(1);
        });


        it('should parse simple get topic', function () {
            const topic = "command/device/Power";
            const getTopic = configParser.parseMQTTGetTopicProperty(topic);
            expect(getTopic.topic).toEqual(topic);
        });
        it('should reject illegal get topic data type', function () {
            const topic = 1234;
            expect(() => configParser.parseMQTTGetTopicProperty(topic)).toThrow("property must be a string or object!");
        });
        it('should parse maxed out get topic', function () {
            const get = {
                topic: "command/device/Birghtness",
                qos: 2,
                messagePattern: "([0-9]+)",
                patternGroupToExtract: 1
            };
            const getTopic = configParser.parseMQTTGetTopicProperty(get);
            expect(getTopic.topic).toEqual(get.topic);
            expect(getTopic.qos).toEqual(get.qos);
            expect(getTopic.messagePattern).toEqual(get.messagePattern);
            expect(getTopic.patternGroupToExtract).toEqual(get.patternGroupToExtract);
        });


        it('should parse simple set topic', function () {
            const topic = "command/device/Power";
            const setTopic = configParser.parseMQTTSetTopicProperty(topic);
            expect(setTopic.topic).toEqual(topic);
        });
        it('should reject illegal data type', function () {
            const topic = 123;
            expect(() => configParser.parseMQTTSetTopicProperty(topic)).toThrow("property has an unsupported data type. Expected string, object or array");
        });
        it('should reject array passed to #parseMQTTSetTopicProperty', function () {
            const topics = ["topic1", "topic2"];
            expect(() => configParser.parseMQTTSetTopicProperty(topics)).toThrow("property cannot be an array, must be an object!");
        });

        it('should parse simple array of set topics', function () {
            const topics = ["command/device/Power1", "command/device/Power2"];
            const setTopics = configParser.parseMultipleMQTTSetTopicsProperty(topics);
            expect(setTopics.constructor).toEqual(Array);
            expect(setTopics[0].topic).toEqual(topics[0]);
            expect(setTopics[1].topic).toEqual(topics[1]);
        });
        it('should reject illegal data type in array', function () {

        });
        it('should reject empty array', function () {

        });

        it('should parse simple set topic object', function () {

        });
        it('should parse simply array of set topic objects', function () {

        });
        it('should parse maxed out set topic object', function () {

        });
    })
});
