const PullTimer = require("../notifications/pulltimer");

startTimer();

function startTimer() {
    console.log("Starting timer...");
    const timer = new PullTimer(console.log, 1000, getStatus.bind(this), value => {
        console.log(value);
    });
    timer.start();
}

function getStatus(callback) {
    callback(null, "value");
}