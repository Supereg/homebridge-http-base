/*
This file has a basic structure to test the mqtt client.
However is currently not automated.
 */

const Logger = require("./logger").Logger;

const MQTTClient = require("../notifications/mqttClient");
const client = new MQTTClient({
    testCharacteristic: function() {
        return true;
    },
    getCharacteristic: function() {
        return {
            getDefaultValue: function() {
                return true;
            },
            updateValue: function(newValue) {
                console.log("new value " + newValue);
            }
        }
    }
}, {
    host: "TODOHOST",
    port: "1883",
    username: "username",
    password: "password"
}, Logger.withPrefix("test"), true);
client.connect();


client.subscribe({
    topic: "testTopic"
}, "On");
