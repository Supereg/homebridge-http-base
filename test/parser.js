const configParser = require("../index").configParser;

parser1();

function parser1() {
    const config = {
        "url": "http://localhost",
        "method": "POST",
        "body": "testBody",
        "auth": {
            "username": "test",
            "password": "testPassword"
        },
        "headers": {
            "Content-Type": "text/html"
        }
    };

    configParser.parseUrlObject(config);
}