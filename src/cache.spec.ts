import {Cache} from './cache';

let cache: Cache;

describe("Cache", function () {
    beforeEach(function () {
        cache = new Cache(1);
    });

    it('should return shouldQuery=true on first call', function () {
        expect(cache.shouldQuery()).toBe(true);
    });
    it('should return shouldQuery=false shortly after last query', function () {
        cache.queried();
        expect(cache.shouldQuery()).toBe(false);
    });

    it('should return shouldQuery=true after cache time expired', function (done) {
        cache.queried();
        setTimeout(() => {
            expect(cache.shouldQuery()).toBe(true);
            done();
        }, 2);
    });

    it('should return shouldQuery=false when caching infinitely', function () {
        const cache = new Cache(-1);
        expect(cache.shouldQuery()).toBe(false);

        cache.queried();
        expect(cache.shouldQuery()).toBe(false);
        expect(cache.isInfinite()).toBe(true);
    });
});
