"use strict";

const expect = require("chai").expect;
const configParser = require("../configparser");

describe("Config Parser", function () {
    describe("URL parser", function () {
        it('should parse simple string url', function () {
            const url = "http://localhost:8080";
            const urlObject = configParser.parseUrlProperty(url);
            expect(urlObject.url).to.equal(url);
        });
        it('should reject illegal data type', function () {
            const url = 1238123;
            expect(() => configParser.parseUrlProperty(url)).to.throw("property has an unsupported data type. Expected string, object or array");
        });
        it('should reject array passed to #parseUrlProperty', function () {
            const url = ["https://localhost:8080"];
            expect(() => configParser.parseUrlProperty(url)).to.throw("property cannot be an array!");
        });

        it('should parse simple array of urls', function () {
            const urls = ["https://localhost:8080", "https://localhost:8081"];
            const urlObjects = configParser.parseMultipleUrlProperty(urls);
            expect(urlObjects.constructor).to.equal(Array);
            expect(urlObjects[0].url).to.equal("https://localhost:8080");
            expect(urlObjects[1].url).to.equal("https://localhost:8081");
        });
        it('should reject illegal data type in array', function () {
            const urls = ["https://localhost:8080", 1237123];
            expect(() => configParser.parseMultipleUrlProperty(urls)).to.throw("Wrong data type. Expected string or object");
        });
        it('should reject empty array', function () {
            const urls = [];
            expect(() => configParser.parseMultipleUrlProperty(urls)).to.throw("array cannot be empty");
        });

        it('should parse simple urlObject', function () {
            const configObject = {
                url: "https://localhost:8080"
            };
            const urlObject = configParser.parseUrlProperty(configObject);
            expect(urlObject.url).to.equal("https://localhost:8080");
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
            expect(urlObjects.constructor).to.equal(Array);
            expect(urlObjects[0].url).to.equal("https://localhost:8080");
            expect(urlObjects[1].url).to.equal("https://localhost:8081");
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
                headers: {"Content-Type": "text/html"},
                strictSSL: true,
                requestTimeout: 1234
            };
            const urlObject = configParser.parseUrlProperty(object);
            expect(urlObject.url).to.equal(object.url);
            expect(urlObject.method).to.equal(object.method);
            expect(urlObject.body).to.equal(object.body);
            expect(urlObject.repeat).to.equal(1);
            expect(urlObject.delayBeforeExecution).to.equal(object.delayBeforeExecution);
            expect(urlObject.auth.username).to.equal(object.auth.username);
            expect(urlObject.auth.password).to.equal(object.auth.password);
            expect(urlObject.auth.sendImmediately).to.equal(object.auth.sendImmediately);
            expect(urlObject.headers["Content-Type"]).to.equal("text/html");
            expect(urlObject.strictSSL).to.equal(object.strictSSL);
            expect(urlObject.requestTimeout).to.equal(object.requestTimeout);
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
            expect(mqttOptions.host).to.equal(mqttObject.host);
            expect(mqttOptions.port).to.equal(mqttObject.port);
            expect(mqttOptions.protocol).to.equal(mqttObject.protocol);
            expect(mqttOptions.username).to.equal(mqttObject.credentials.username);
            expect(mqttOptions.password).to.equal(mqttObject.credentials.password);
            expect(mqttOptions.keepalive).to.equal(mqttObject.keepalive);
            expect(mqttOptions.clean).to.equal(mqttObject.clean);
            expect(mqttOptions.reconnectPeriod).to.equal(mqttObject.reconnectPeriod);
            expect(mqttOptions.connectTimeout).to.equal(mqttObject.connectTimeout);
            expect(mqttOptions.clientId).to.equal(mqttObject.clientId);
            expect(mqttOptions.rejectUnauthorized).to.equal(mqttObject.rejectUnauthorized);
            expect(mqttOptions.will.topic).to.equal(mqttObject.will.topic);
            expect(mqttOptions.will.payload).to.equal(mqttObject.will.payload);
            expect(mqttOptions.will.qos).to.equal(mqttObject.will.qos);
            expect(mqttOptions.will.retain).to.equal(mqttObject.will.retain);

            const subscription = mqttOptions.subscriptions[0];
            expect(subscription.topic).to.equal("testTopic");
            expect(subscription.characteristic).to.equal("On");
            expect(subscription.qos).to.equal(0);
            expect(subscription.messagePattern).to.equal("true");
            expect(subscription.patternGroupToExtract).to.equal(1);
        });


        it('should parse simple get topic', function () {
            const topic = "command/device/Power";
            const getTopic = configParser.parseMQTTGetTopicProperty(topic);
            expect(getTopic.topic).to.equal(topic);
        });
        it('should reject illegal get topic data type', function () {
            const topic = 1234;
            expect(() => configParser.parseMQTTGetTopicProperty(topic)).to.throw("property must be a string or object!");
        });
        it('should parse maxed out get topic', function () {
            const get = {
                topic: "command/device/Birghtness",
                qos: 2,
                messagePattern: "([0-9]+)",
                patternGroupToExtract: 1
            };
            const getTopic = configParser.parseMQTTGetTopicProperty(get);
            expect(getTopic.topic).to.equal(get.topic);
            expect(getTopic.qos).to.equal(get.qos);
            expect(getTopic.messagePattern).to.equal(get.messagePattern);
            expect(getTopic.patternGroupToExtract).to.equal(get.patternGroupToExtract);
        });


        it('should parse simple set topic', function () {
            const topic = "command/device/Power";
            const setTopic = configParser.parseMQTTSetTopicProperty(topic);
            expect(setTopic.topic).to.equal(topic);
        });
        it('should reject illegal data type', function () {
            const topic = 123;
            expect(() => configParser.parseMQTTSetTopicProperty(topic)).to.throw("property has an unsupported data type. Expected string, object or array");
        });
        it('should reject array passed to #parseMQTTSetTopicProperty', function () {
            const topics = ["topic1", "topic2"];
            expect(() => configParser.parseMQTTSetTopicProperty(topics)).to.throw("property cannot be an array, must be an object!");
        });

        it('should parse simple array of set topics', function () {
            const topics = ["command/device/Power1", "command/device/Power2"];
            const setTopics = configParser.parseMultipleMQTTSetTopicsProperty(topics);
            expect(setTopics.constructor).to.equal(Array);
            expect(setTopics[0].topic).to.equal(topics[0]);
            expect(setTopics[1].topic).to.equal(topics[1]);
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
