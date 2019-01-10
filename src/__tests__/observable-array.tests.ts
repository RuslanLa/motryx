import { autoRun, observable, action } from "../observable";
import { Monkey } from "./monkey";

class Jungle {
  @observable
  monkeys = [new Monkey()];
  @action
  addMonkey = () => {
    this.monkeys.push(new Monkey());
  };
}

let jungle = new Jungle();
const autorunCounter = jest.fn();

beforeEach(() => {
  jungle = new Jungle();
  autorunCounter.mockClear();
});

describe("observable array tests", () => {
  test("should not run subscriber of reference on push", () => {
    autoRun(() => {
      autorunCounter(jungle.monkeys);
    });
    autorunCounter.mockClear();
    jungle.addMonkey();
    expect(autorunCounter).not.toBeCalled();
  });
  test("should run subscriber of length on push", () => {
    autoRun(() => {
      autorunCounter(jungle.monkeys.length);
    });
    autorunCounter.mockClear();
    jungle.addMonkey();
    expect(autorunCounter).toBeCalled();
  });
});
