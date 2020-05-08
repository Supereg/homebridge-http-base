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
            // @ts-ignore
            const registration = global.notificationRegistration || api.notificationRegistration;

            if (registration && typeof registration === "function") {
                try {
                    registration(notificationID, handler, notificationPassword);
                    log("Detected running notification server. Registered successfully!");
                } catch (error) {
                    log("Could not register notification handler. ID '" + notificationID + "' is already taken!")
                }
            }
        });
    }
}
