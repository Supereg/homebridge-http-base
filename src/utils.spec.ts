import {utils} from "./index";
import {Characteristic, Service} from "hap-nodejs";

describe("utils", function () {
    describe("pattern", function () {
        it('should extract number correctly', function () {
            expect(utils.extractValueFromPattern(/asd(\d)/, "asd4")).toEqual("4");
        });
        it('should fail on unmatched pattern', function () {
            expect(() => {
                utils.extractValueFromPattern(/asdf/, "lol")
            }).toThrow(Error);
        });
        it('should fail with position out of range', function () {
            expect(() => {
                utils.extractValueFromPattern(/asd(\d)/, "asd4", 2);
            }).toThrow(Error);
        });
    });

    describe("enum", function () {
        let enumObject: any;
        beforeAll(function () {
            enumObject = Object.freeze({
                VALUE_1: "value1",
                VALUE_2: "value2",
            });
        });

        it('should retrieve enum value', function () {
            expect(utils.enumValueOf(enumObject!, "value1", enumObject.VALUE_2)).toEqual(enumObject.VALUE_1);
        });
        it('should fallback to default value', function () {
            expect(utils.enumValueOf(enumObject!, undefined, enumObject.VALUE_2)).toEqual(enumObject.VALUE_2);
        });
    });

    describe("once", function () {
        it('should run only once', function () {
            let boolean = true;
            const fun = () => {
                boolean = !boolean;
            };

            const once = utils.once(fun);
            once();
            expect(once).toThrow(Error);
            expect(boolean).toEqual(false);
        });
    });

    describe("characteristics search", function () {
        let service: Service | undefined;
        beforeAll(function () {
            service = new Service.HumiditySensor('', '');
        });

        it('should test added characteristic', function () {
            expect(utils.testCharacteristic(service!, "CurrentRelativeHumidity")).toEqual(true);
        });
        it('should test optional characteristic', function () {
            expect(utils.testCharacteristic(service!, "StatusActive")).toEqual(false);
        });
        it('should test characteristic not added', function () {
            expect(utils.testCharacteristic(service!, "RotationSpeed")).toEqual(false);
        });
        it('should reject malformed name', function () {
            expect(utils.testCharacteristic(service!, "Current Relative Humidity")).toEqual(false);
        });

        it('should get added characteristic', function () {
            expect(utils.getCharacteristic(service!, "CurrentRelativeHumidity")).toBeInstanceOf(Characteristic.CurrentRelativeHumidity);
        });
        it('should get optional characteristic', function () {
            expect(utils.getCharacteristic(service!, "StatusActive")).toBeNull();
        });
        it('should get characteristic not added', function () {
            expect(utils.getCharacteristic(service!, "RotationSpeed")).toBeNull();
        });
        it('should reject malformed name in get', function () {
            expect(utils.getCharacteristic(service!, "Current Relative Humidity")).toBeNull();
        });
    });
});
