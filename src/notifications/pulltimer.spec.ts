import {PullTimer} from "./pulltimer";

describe("PullTimer", function () {
    describe("execution", function () {
        let pullTimer: PullTimer;
        let value: number | undefined;
        beforeAll(function () {

            pullTimer = new PullTimer(console.log, 20, callback => callback(null, value? value + 1: 1),
                v => value = v);
            pullTimer.start();
        });
        afterAll(function () {
            pullTimer.stop();
            value = undefined;
        });

        it('should be undefined before timer was executed', function () {
            expect(value).toBeUndefined();
        });
        it('should be 1 after first execution', function (done) {
            setTimeout(() => {
                expect(value).toEqual(1);
                done();
            }, 21)
        });
        it('should be 2 after second execution', function (done) {
            setTimeout(() => {
                expect(value).toEqual(2);
                done();
            }, 21)
        });
        it('should be 3 after third execution', function (done) {
            setTimeout(() => {
                expect(value).toEqual(3);
                done();
            }, 21)
        });
    });

    describe("reset", function () {
        let pullTimer: PullTimer;
        let value: number | undefined;
        beforeAll(function () {
            pullTimer = new PullTimer(console.log, 5, callback => callback(null, value? value + 1: 1),
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
                pullTimer.resetTimer();

                setTimeout(() => {
                    expect(value).toBeUndefined();
                    setTimeout(() => {
                        expect(value).toEqual(1);
                        done();
                    }, 3);
                }, 2);
            }, 2);
        });
    })
});
