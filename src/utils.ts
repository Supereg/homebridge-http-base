import {Service} from "hap-nodejs";

export function extractValueFromPattern(pattern: RegExp, string: string, position: number = 1): string {
    const matchArray = string.match(pattern);

    if (matchArray === null) // pattern didn't match at all
        throw new Error(`Pattern didn't match (value: '${string}', pattern: '${pattern}')`);
    else if (position >= matchArray.length)
        throw new Error("Couldn't find any group which can be extracted. The specified group from which the data should be extracted was out of bounds");
    else
        return matchArray[position];
}

export function enumValueOf(enumObject: any, property: any, defaultValue: any): any {
    let value = property || defaultValue;
    value = value.toLowerCase();

    let valid = false;
    Object.keys(enumObject).forEach(key => {
        const objectElement = enumObject[key];

        if (value === objectElement)
            valid = true;
    });

    return valid? value: null;
}

export function once(func: Function) {
    let called = false;

    return (...args: any[]) => {
        if (called) {
            throw new Error("This callback function has already been called by someone else; it can only be called one time.");
        } else {
            called = true;
            return func(...args);
        }
    };
}

export function testCharacteristic(service: Service, name: string) {
    let index, characteristic;
    for (index in service.characteristics) {
        characteristic = service.characteristics[index];

        if (!characteristic.displayName)
            continue;

        const strippedName = characteristic.displayName.replace(/ /g, '');
        if (strippedName === name) {
            return true;
        }
    }

    return false;
}

export function getCharacteristic(service: Service, name: string) {
    let characteristic;
    for (let index in service.characteristics) {
        characteristic = service.characteristics[index];

        if (!characteristic.displayName)
            continue;

        const strippedName = characteristic.displayName.replace(/ /g, '');
        if (strippedName === name) {
            return characteristic;
        }
    }

    return null;
}
