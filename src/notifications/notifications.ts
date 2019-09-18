export type NotificationRequestBody = {
    service?: string,
    characteristic: string,
    value: any
}

export function enqueueNotificationRegistrationIfDefined(api: any, log: typeof console.log,
                                                         notificationID: string, notificationPassword: string,
                                                         handler: (body: NotificationRequestBody) => void) {
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
