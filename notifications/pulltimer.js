module.exports = PullTimer;

function PullTimer(log, interval, pullMethod, successHandler) {
    this.log = log;
    this.interval = interval;
    this.handler = pullMethod;
    this.successHandler = successHandler;
}

PullTimer.prototype = {

    start: function () {
        this.timeout = setTimeout(this._handleTimer.bind(this), this.interval);
    },

    resetTimer: function () {
        if (!this.timeout)
            return;

        clearTimeout(this.timeout);
        this.timeout = setTimeout(this._handleTimer.bind(this), this.interval);
    },

    _handleTimer: function () {
        this.handler(this._once((error, value) => {
            if (error)
                this.log("Error occurred while pulling update from switch: " + error.message);
            else
                this.successHandler(value);

            this.resetTimer();
        }));
    },

    _once: function (func) {
        let called = false;

        return function() {
            if (called)
                throw new Error("This callback function has already been called by someone else; it can only be called one time.");
            else {
                called = true;
                return func.apply(this, arguments);
            }
        };
    }

};