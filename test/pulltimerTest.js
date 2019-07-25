"use static";

const expect = require("chai").expect;
const PullTimer = require("../notifications/pulltimer");

describe("PullTimer", function () {
    describe("execution", function () {
        before("create PullTimer", function () {
            this.pullTimer = new PullTimer(console.log, 20, callback => callback(null, this.value? this.value + 1: 1),
                value => this.value = value);
            this.pullTimer.start();
        });
        after("destroy PullTimer", function () {
            this.pullTimer.stop();
            this.value = undefined;
        });

        it('should be undefined before timer was executed', function () {
            expect(this.value).to.be.undefined;
        });
        it('should be 1 after first execution', function (done) {
            setTimeout(() => {
                expect(this.value).to.equal(1);
                done();
            }, 20)
        });
        it('should be 2 after first execution', function (done) {
            setTimeout(() => {
                expect(this.value).to.equal(2);
                done();
            }, 20)
        });
        it('should be 3 after first execution', function (done) {
            setTimeout(() => {
                expect(this.value).to.equal(3);
                done();
            }, 20)
        });
    });

    describe("reset", function () {
        before("create PullTimer", function () {
            this.pullTimer = new PullTimer(console.log, 5, callback => callback(null, this.value? this.value + 1: 1),
                value => this.value = value);
            this.pullTimer.start();
        });
        after("destroy PullTimer", function () {
            this.pullTimer.stop();
            this.value = undefined;
        });

        it('should be 1 only after execution of 7ms when resetting timer after 2ms', function (done) {
            expect(this.value).to.be.undefined;

            setTimeout(() => {
                expect(this.value).to.be.undefined;
                this.pullTimer.resetTimer();

                setTimeout(() => {
                    expect(this.value).to.be.undefined;
                    setTimeout(() => {
                        expect(this.value).to.equal(1);
                        done();
                    }, 3);
                }, 2);
            }, 2);
        });
    })
});
