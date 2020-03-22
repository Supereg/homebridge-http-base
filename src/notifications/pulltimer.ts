import * as utils from '../utils';
import Timeout = NodeJS.Timeout;
import {CharacteristicGetCallback} from "hap-nodejs";

export class PullTimer {

    log: any;
    interval: number;
    handler: (cb: CharacteristicGetCallback) => void;
    successHandler: (value: any) => void;

    private timeout?: Timeout;

    constructor(log: any, interval: number, handler: (cb: CharacteristicGetCallback) => void, successHandler: (value: any) => void) {
        this.log = log;
        this.interval = interval;
        this.handler = handler;
        this.successHandler = successHandler;
    }

    start() {
        if (!this.timeout) {
            this.timeout = setTimeout(this.handleTimer.bind(this), this.interval);
        } else {
            this.timeout.refresh();
        }
    }

    resetTimer() {
        if (!this.timeout)
            return;

        this.timeout.refresh();
    }

    stop() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = undefined;
    }

    private handleTimer() {
        this.handler(utils.once((error: Error | null, value?: any) => {
            if (error)
                this.log("Error occurred while pulling update from switch: " + error.message);
            else
                this.successHandler(value);

            this.resetTimer();
        }));
    }

}
