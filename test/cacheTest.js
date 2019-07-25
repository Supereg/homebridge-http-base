"use strict";

const expect = require("chai").expect;
const Cache = require("../cache");

describe("Cache", function () {
    beforeEach(function () {
        this.cache = new Cache(1);
    });
    afterEach(function () {
        this.cache = undefined;
    });

    it('should handle illegal cacheTime values correctly', function () {
        const cache = new Cache("asdf", 142);
        expect(cache.cacheTime).to.equal(142);
    });

    it('should return shouldQuery=true on first call', function () {
        expect(this.cache.shouldQuery()).to.be.true;
    });
    it('should return shouldQuery=false shortly after last query', function () {
        this.cache.queried();
        expect(this.cache.shouldQuery()).to.be.false;
    });

    it('should return shouldQuery=true after cache time expired', function (done) {
        this.cache.queried();
        setTimeout(() => {
            expect(this.cache.shouldQuery()).to.be.true;
            done();
        }, 2);
    });

    it('should return shouldQuery=false when caching infinitely', function () {
        const cache = new Cache(-1);
        expect(cache.shouldQuery()).to.be.false;

        cache.queried();
        expect(cache.shouldQuery()).to.be.false;
        expect(cache.isInfinite()).to.be.true;
    });
});
