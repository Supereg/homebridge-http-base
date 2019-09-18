export class Cache {

    cacheTime: number;
    lastQueried: number = 0;

    constructor(cacheTime: number | undefined, defaultTime: number = 0) {
        this.cacheTime = defaultTime;

        if (typeof cacheTime !== "undefined")
            this.cacheTime = cacheTime;
    }

    queried() {
        this.lastQueried = new Date().getTime();
    }

    isInfinite(): boolean {
        return this.cacheTime < 0;
    }

    shouldQuery(): boolean {
        if (this.isInfinite())
            return false;

        const timeSinceLastQuery = new Date().getTime() - this.lastQueried;
        return timeSinceLastQuery > this.cacheTime;
    }

}
