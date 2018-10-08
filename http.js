const request = require("request");
const async = require("async");

module.exports = {

    httpRequest: function (urlObject, callback) {
        let auth = undefined;

        if (urlObject.auth.username && urlObject.auth.password) {
            auth = {};
            auth.username = urlObject.auth.username;
            auth.password = urlObject.auth.password;
        }

        request(
            {
                url: urlObject.url,
                body: urlObject.body,
                method: urlObject.method,
                headers: urlObject.headers,
                auth: auth,
                strictSSL: urlObject.strictSSL
            },
            (error, response, body) => {
                callback(error, response, body);
            }
        )
    },

    multipleHttpRequests: function (urlObjectArray, callback, asyncFunction) {
        if (urlObjectArray.length === 0)
            throw new Error("Empty urlObject array");

        if (!asyncFunction)
            asyncFunction = async.parallel;

        const taskArray = new Array(urlObjectArray.length);

        for (let i = 0; i < urlObjectArray.length; i++) {
            const urlObject = urlObjectArray[i];

            taskArray[i] = callback => this.httpRequest(urlObject, callback); // callback gets (error, response, body)
        }

        asyncFunction(async.reflectAll(taskArray), (ignored, results) => {
            const callbackArray = new Array(results.length);

            for (let i = 0; i < results.length; i++) {
                const element = results[i];

                if (element.error) {
                    callbackArray[i] = {
                        error: element.error
                    };
                }
                else if (element.value) {
                    callbackArray[i] = {
                        response: element.value[0],
                        body: element.value[1]
                    };
                }
            }

            callback(callbackArray);
        });
    }

};