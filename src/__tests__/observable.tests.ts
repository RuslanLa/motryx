import { Monkey } from './monkey';
import { autoRun } from "../observable";

let monkey = new Monkey();
const someAction = jest.fn();
beforeEach(() => {
    monkey = new Monkey();
    someAction.mockClear();
});
describe('autorun tests', () => {
    test('should run firstly on subscription', () => {
        autoRun(() => {
            someAction(monkey.fullness);

        });
        expect(someAction).toBeCalledTimes(1);
    });
    test('should run exactly same count as observable fields changed', () => {
        monkey = new Monkey();
        autoRun(() => {
            someAction(monkey.fullness);
        });
        monkey.fullness = 100;
        expect(someAction).toBeCalledTimes(2);
        monkey.fullness = 100;
        expect(someAction).toBeCalledTimes(3);
        monkey.fullness = 10;
        monkey.fullness = 4;
        expect(someAction).toBeCalledTimes(5);
    })
});