module.exports = {

    enqueueNotificationRegistrationIfDefined: function (api, log, notificationID, notificationPassword, handler) {
        if (notificationID) {
            api.on('didFinishLaunching', () => {
                /** @namespace api.notificationRegistration */
                if (api.notificationRegistration && typeof api.notificationRegistration === "function") {
                    try {
                        api.notificationRegistration(notificationID, handler, notificationPassword);
                        log("Detected running notification server. Registered successfully!");
                    } catch (error) {
                        log("Could not register notification handler. ID '" + notificationID + "' is already taken!")
                    }
                }
            });
        }
    }

};
