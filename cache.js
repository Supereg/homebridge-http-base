"use strict";

module.exports = Cache;

function Cache(cacheTime, defaultTime) {
    this.cacheTime = defaultTime;
    this.lastQueried = 0;

    if (typeof cacheTime === "number")
        this.cacheTime = cacheTime;
}

Cache.prototype = {

    queried: function () {
        this.lastQueried = new Date().getTime();
    },

    isInfinite: function () {
      return this.cacheTime < 0;
    },

    shouldQuery: function() {
        if (this.cacheTime < 0)
            return false;

        const timeSinceLastQuery = new Date().getTime() - this.lastQueried;
        return timeSinceLastQuery > this.cacheTime;
    }

};
