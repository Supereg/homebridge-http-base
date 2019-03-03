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

    httpRequest: function (urlObject, callback) {
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

        for (let i = 2; i < arguments.length; i++) {
            const element = arguments[i];
            if (typeof element !== "object")
                continue;

            let args = element;
            if (element.constructor === Object)
                args = [element];

            /** @namespace argument.searchValue */
            for (let j = 0; j < args.length; j++) {
                const argument = args[j];
                url = url.replace(argument.searchValue, argument.replacer);
                if (body)
                    body = body.replace(argument.searchValue, argument.replacer);
            }
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
        const executionCounter = [];

        for (let i = 0; i < urlObjectArray.length; i++) {
            const urlObject = urlObjectArray[i];

            if (executionCounter[i] === undefined)
                executionCounter[i] = urlObject.repeat;

            taskArray.push(callback, delayed => {  // callback gets (error, response, body)
                if (urlObject.url.startsWith("delay") && delayPattern.test(urlObject.url)) {
                    if (multipleUrlExecutionStrategy !== ExecutionStrategy.SERIES) {
                        console.warn("There was a 'delay' method specified but execution is unaffected because of unsuitable execution strategy!");
                        callback();
                        return;
                    }

                    const delay = parseInt(urlObject.url.match(numberPattern)[0]);

                    // execute callback from async framework => finish urlObject
                    setTimeout(() => callback(), delay);
                    return;
                }

                if (!delayed && urlObject.delayBeforeExecution > 0) {
                    const self = arguments.callee;
                    // execute the current method a second time though delayed=true
                    setTimeout(() => self(callback, true), urlObject.delayBeforeExecution);
                    return;
                }

                this.httpRequest(urlObject, callback, argument);
            });

            executionCounter[i]--;
            if (executionCounter[i] > 0)
                i--; // repeat current urlObject
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
