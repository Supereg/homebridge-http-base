module.exports = {

    getEmptyUrlObject: function () {
        return {
            url: undefined,
            method: "GET",
            body: "",
            auth: {
                username: undefined,
                password: undefined
            },
            headers: {}
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
        }

        if (property.headers)
            urlObject.headers = property.headers;

        return urlObject
    }

};