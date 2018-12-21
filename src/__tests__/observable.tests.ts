import { Monkey } from './monkey';
import { autoRun } from "../observable";

let monkey = new Monkey();
const someAction = jest.fn();
const autorunCounter = jest.fn();
beforeEach(() => {
    monkey = new Monkey();
    someAction.mockClear();
    autorunCounter.mockClear();
});
describe('autorun tests', () => {
    test('should run firstly on subscription', () => {
        autoRun(() => {
            someAction(monkey.fullness);
            autorunCounter();

        });
        expect(autorunCounter).toBeCalledTimes(1);
    });
    test('should run exactly same count as observable fields changed', () => {
        autoRun(() => {
            someAction(monkey.fullness);
            autorunCounter();
        });
        autorunCounter.mockClear();
        monkey.fullness = 100;
        expect(autorunCounter).toBeCalledTimes(1);
        monkey.fullness = 100;
        expect(autorunCounter).toBeCalledTimes(2);
        monkey.fullness = 10;
        monkey.fullness = 4;
        expect(autorunCounter).toBeCalledTimes(4);
    });
    test('should subscribe several fields', () => {
        autoRun(() => {
            someAction(monkey.fullness);
            someAction(monkey.health);
            autorunCounter();
        });
        autorunCounter.mockClear();
        monkey.fullness = 100;
        monkey.health = 100;
        expect(autorunCounter).toBeCalledTimes(2);
    });
    test('should not affect not subscribed fields', () => {
        autoRun(() => {
            someAction(monkey.fullness);
            autorunCounter();
        });
        autorunCounter.mockClear();
        monkey.health = 100;
        expect(autorunCounter).not.toBeCalled();
    });
    test('should run once changes in action', () => {
        autoRun(() => {
            someAction(monkey.fullness);
            someAction(monkey.health);
            autorunCounter();
        });
        autorunCounter.mockClear();
        monkey.feed({ calorie: 20, effect: -10 });
        expect(autorunCounter).toBeCalledTimes(1);
    });
    test('should run with actual value', () => {
        autoRun(() => {
            someAction(monkey.fullness);
        });
        someAction.mockClear();
        monkey.fullness = 90;
        expect(someAction).toBeCalledWith(90);
    });
    test('should rerun only child', () => {
        autoRun(() => {
            someAction();
            autoRun(() => {
                autorunCounter(monkey.fullness);
            })
        });
        autorunCounter.mockClear();
        someAction.mockClear();
        monkey.feed({ calorie: 20, effect: -10 });
        expect(autorunCounter).toBeCalledTimes(1);
        expect(someAction).not.toBeCalled();

    })
    test('should run child only once', () => {
        autoRun(() => {
            const v = Math.random();
            someAction(monkey.fullness);
            console.log('parent');
            autoRun(() => {
                autorunCounter(monkey.fullness);
                console.log(v);
            })
        });
        console.log('next');
        autorunCounter.mockClear();
        someAction.mockClear();
        monkey.feed({ calorie: 20, effect: -10 });
        expect(autorunCounter).toBeCalledTimes(1);
        expect(someAction).toBeCalledTimes(1);

    })
});