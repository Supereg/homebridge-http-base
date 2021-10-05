import {PullTimer} from "./pulltimer";

describe("PullTimer", function () {
    describe("execution", function () {
        let pullTimer: PullTimer;
        let value: number | undefined;
        beforeAll(function () {

            pullTimer = new PullTimer(console.log, 200, callback => callback(null, value? value + 1: 1),
                v => value = v);
            pullTimer.start();
        });
        afterAll(function () {
            pullTimer.stop();
            value = undefined;
        });

        test('undefined before timer was executed', function () {
            expect(value).toBeUndefined();
        });

        test('should be greater equal 1 after 200ms', function (done) {
            setTimeout(() => {
                expect(value).toBeGreaterThanOrEqual(1)
                done()
            }, 200)
        })
    });

    describe("reset", function () {
        let pullTimer: PullTimer;
        let value: number | undefined;
        beforeAll(function () {
            pullTimer = new PullTimer(console.log, 200, callback => callback(null, value? value + 1: 1),
                v => value = v);
            pullTimer.start();
        });
        afterAll(function () {
            pullTimer.stop();
            value = undefined;
        });

        it('should be 1 only after execution of 7ms when resetting timer after 2ms', function (done) {
            expect(value).toBeUndefined();

            setTimeout(() => {
                expect(value).toBeUndefined();
                pullTimer.resetTimer(); // reset means timer runs another 200 ms

                setTimeout(() => {
                    expect(value).toBeUndefined();
                    setTimeout(() => {
                        expect(value).toEqual(1);
                        done();
                    }, 150);
                }, 100);
            }, 50);
        });
    })
});
