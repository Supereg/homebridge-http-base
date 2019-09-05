"use strict";

module.exports = {

    extractValueFromPattern: function (pattern, string, position) {
        if (typeof position === "undefined")
            position = 1; // default value

        const matchArray = string.match(pattern);

        if (matchArray === null) // pattern didn't match at all
            throw new Error(`Pattern didn't match (value: '${string}', pattern: '${pattern}')`);
        else if (position >= matchArray.length)
            throw new Error("Couldn't find any group which can be extracted. The specified group from which the data should be extracted was out of bounds");
        else
            return matchArray[position];
    },

    enumValueOf: function (enumObject, property, defaultValue) {
        let value = property || defaultValue;
        value = value.toLowerCase();

        let valid = false;
        Object.keys(enumObject).forEach(key => {
            const objectElement = enumObject[key];

            if (value === objectElement)
                valid = true;
        });

        return valid? value: null;
    },

    once: function (func) {
        let called = false;

        return function() {
            if (called)
                throw new Error("This callback function has already been called by someone else; it can only be called one time.");
            else {
                called = true;
                return func.apply(this, arguments);
            }
        };
    },

    testCharacteristic: function (service, name) {
        let index, characteristic;
        for (index in service.characteristics) {
            characteristic = service.characteristics[index];

            const strippedName = characteristic.displayName.replace(/ /g, '');
            if (strippedName === name) {
                return true;
            }
        }

        return false;
    },

    getCharacteristic: function (service, name) {
        let characteristic;
        for (let index in service.characteristics) {
           characteristic = service.characteristics[index];

           const strippedName = characteristic.displayName.replace(/ /g, '');
           if (strippedName === name) {
               return characteristic;
           }
        }

        return null;
    }

};
