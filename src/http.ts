import {Credentials, UrlObject} from "./configparser";
import async = require("async");
import request = require("request");
import {AuthOptions, RequestCallback, Response} from "request";
import {AsyncFunction} from "async";

const delayPattern = /^delay\(\d+\)*$/;
const numberPattern = /\d+/;

export class ExecutionStrategy {
    static PARALLEL = async.parallel;
    static SERIES = async.series;

    static get(name: string) {
        name = name.toUpperCase();
        switch (name) {
            case "PARALLEL":
                return this.PARALLEL;
            case "SERIES":
                return this.SERIES;
            default:
                return null;
        }
    }

}

export type ErrorResponseObject = {
    error?: Error
}

export type ResponseObject = {
    response: string,
    body: string
}



let multipleUrlExecutionStrategy = ExecutionStrategy.PARALLEL;

export function setMultipleUrlExecutionStrategy(strategyString: string) {
    const strategy = ExecutionStrategy.get(strategyString);

    if (strategy) {
        multipleUrlExecutionStrategy = strategy;
        return true;
    }
    return false;
}

export function isHttpSuccessCode(statusCode: number) {
    return Math.floor(statusCode / 100) === 2;
}

export function httpRequest(urlObject: UrlObject, callback: RequestCallback) {
    let url = urlObject.url;
    let body = urlObject.body;
    let auth: AuthOptions | undefined = undefined;

    if (urlObject.auth && urlObject.auth.username && urlObject.auth.password) {
        auth = {
            username: urlObject.auth.username,
            password: urlObject.auth.password
        };

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
        (error: any, response: Response, body: any) => {
            callback(error, response, body);
        }
    )
}

export function multipleHttpRequests(urlObjectArray: UrlObject[], callback: (result: (ErrorResponseObject | ResponseObject)[]) => void) {
    if (urlObjectArray.length === 0)
        throw new Error("Empty urlObject array");

    const taskArray: AsyncFunction<Response, Error>[] = []; //Array<AsyncFunction<T, E>
    const executionCounter = [];

    for (let i = 0; i < urlObjectArray.length; i++) {
        const urlObject = urlObjectArray[i];

        if (executionCounter[i] === undefined)
            executionCounter[i] = urlObject.repeat;

        taskArray.push((callback: (error?: Error, response?: Response, body?: any) => void, delayed?: boolean) => {
            if (urlObject.url.startsWith("delay") && delayPattern.test(urlObject.url)) {
                if (multipleUrlExecutionStrategy !== ExecutionStrategy.SERIES) {
                    console.warn("There was a 'delay' method specified but execution is unaffected because of unsuitable execution strategy!");
                    callback();
                    return;
                }

                const delay = parseInt(urlObject.url.match(numberPattern)![0]);

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

            httpRequest(urlObject, callback);
        });

        executionCounter[i]--;
        if (executionCounter[i] > 0)
            i--; // repeat current urlObject
    }

    // (err?: E | null, results?: Array<T | undefined>): void;
    // Array<(callback: (err: null, result: {error?: E, value?: T})

    // result: export interface AsyncResultArrayCallback<T, E = Error> { (err?: E | null, results?: Array<T | undefined>): void; }
    multipleUrlExecutionStrategy(async.reflectAll(taskArray), (error: Error | null | undefined, results?: any) => {
        const callbackArray: (ErrorResponseObject | ResponseObject)[] = [];

        for (let i = 0; i < results.length; i++) {
            const element = results[i];

            if (element.error) {
                callbackArray.push({
                    error: element.error
                });
            } else if (element.value) {
                callbackArray.push({
                    response: element.value[0],
                    body: element.value[1]
                });
            }
        }

        callback(callbackArray);
    });
}
