const utils = require("../utils");

module.exports = PullTimer;

function PullTimer(log, interval, pullMethod, successHandler) {
    this.log = log;
    this.interval = interval;
    this.handler = pullMethod;
    this.successHandler = successHandler;
}

PullTimer.prototype = {

    start: function () {
        if (this.timeout) {
            this.resetTimer();
            return;
        }

        this.timeout = setTimeout(this._handleTimer.bind(this), this.interval);
    },

    resetTimer: function () {
        if (!this.timeout)
            return;

        clearTimeout(this.timeout);
        this.timeout = setTimeout(this._handleTimer.bind(this), this.interval);
    },

    stop: function () {
        if (this.timeout)
            clearTimeout(this.timeout);

        this.timeout = undefined;
    },

    _handleTimer: function () {
        this.handler(utils.once((error, value) => {
            if (error)
                this.log("Error occurred while pulling update from switch: " + error.message);
            else
                this.successHandler(value);

            this.resetTimer();
        }));
    }

};
