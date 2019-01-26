const request = require("request");
const async = require("async");

const delayPattern = /^delay\(\d+\)*$/;
const numberPattern = /\d+/;

const ExecutionStrategy = Object.freeze({
    PARALLEL: async.parallel,
    SERIES: async.series,
});


let multipleUrlExecutionStrategy = ExecutionStrategy.PARALLEL;

module.exports = {

    setMultipleUrlExecutionStrategy: function (strategyString) {
        strategyString = strategyString.toUpperCase();
        const strategy = ExecutionStrategy[strategyString];

        if (strategy) {
            multipleUrlExecutionStrategy = strategy;
            return true;
        }

        return false;
    },

    isHttpSuccessCode: function (statusCode) {
        return Math.floor(statusCode / 100) === 2;
    },

    httpRequest: function (urlObject, callback, argument) {
        let url = urlObject.url;
        let body = urlObject.body;
        let auth = undefined;

        if (urlObject.auth && urlObject.auth.username && urlObject.auth.password) {
            auth = {};
            auth.username = urlObject.auth.username;
            auth.password = urlObject.auth.password;

            if (typeof urlObject.auth.sendImmediately !== "undefined")
                auth.sendImmediately = urlObject.auth.sendImmediately;
        }

        if (typeof argument !== "undefined" && argument !== null) {
            url = url.replace("%s", argument)
            if (body)
                body = body.replace("%s", argument);
        }

        request(
            {
                url: url,
                body: body,
                method: urlObject.method || "GET",
                headers: urlObject.headers,
                auth: auth,
                strictSSL: urlObject.strictSSL,
                timeout: urlObject.requestTimeout || 20000,
            },
            (error, response, body) => {
                callback(error, response, body);
            }
        )
    },

    multipleHttpRequests: function (urlObjectArray, callback, argument) {
        if (urlObjectArray.length === 0)
            throw new Error("Empty urlObject array");

        const taskArray = new Array(urlObjectArray.length);

        for (let i = 0; i < urlObjectArray.length; i++) {
            const urlObject = urlObjectArray[i];

            taskArray[i] = callback => {  // callback gets (error, response, body)
                if (urlObject.url.startsWith("delay") && delayPattern.test(urlObject.url)) {
                    if (multipleUrlExecutionStrategy !== ExecutionStrategy.SERIES) {
                        console.warn("There was a 'delay' method specified but execution is unaffected because of unsuitable execution strategy!");
                        callback();
                        return;
                    }

                    const delay = parseInt(urlObject.url.match(numberPattern)[0]);

                    setTimeout(() => callback(), delay);
                    return;
                }

                this.httpRequest(urlObject, callback, argument);
            };
        }

        multipleUrlExecutionStrategy(async.reflectAll(taskArray), (ignored, results) => {
            const callbackArray = [];

            for (let i = 0; i < results.length; i++) {
                const element = results[i];

                if (element.error) {
                    callbackArray.push({
                        error: element.error
                    });
                }
                else if (element.value) {
                    callbackArray.push({
                        response: element.value[0],
                        body: element.value[1]
                    });
                }
            }

            callback(callbackArray);
        });
    }

};