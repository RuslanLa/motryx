const observers = new Map<string, (() => void)[]>();

let count = 0;
let isInsideAction = false;
let subscribersToRun: (() => void)[] = [];
let subscriber: (() => void) | null = null;

const idSymbol = Symbol("id");

const defineInnerKey = (object: any) => {
  Object.defineProperty(object, idSymbol, {
    configurable: false,
    enumerable: false,
    value: count,
    writable: false
  });
  count++;
};

const defineInnerPropertyValue = (
  object: any,
  innerPropSymbol: symbol,
  value?: any
) => {
  Object.defineProperty(object, innerPropSymbol, {
    configurable: false,
    enumerable: false,
    value: value,
    writable: true
  });
};
const getObserversKey = (obj: any, key: string | symbol) =>
  obj[idSymbol] + key.toString();

const runSubscriber = (callback: () => void) => {
  subscriber = callback;
  callback();
  subscriber = null;
};

const hasProp = (obj: any, key: symbol | string): boolean => {
  if (typeof obj !== "object") {
    throw Error("Expected object");
  }
  return (obj as Object).hasOwnProperty(key);
};

export function observable(target: any, key: string | symbol): any {
  const innerPropSymbol = Symbol(key.toString());
  return {
    set: function (value: any) {
      if (!hasProp(this, idSymbol)) {
        defineInnerKey(this);
      }
      if (!hasProp(this, innerPropSymbol)) {
        defineInnerPropertyValue(this, innerPropSymbol, value);
      }
      this[innerPropSymbol] = value;
      const propertyObservers = observers.get(getObserversKey(this, key));
      if (!propertyObservers) {
        return;
      }
      propertyObservers!.forEach(callback => {
        if (isInsideAction) {
          subscribersToRun.push(callback);
          return;
        }
        runSubscriber(callback);
      });
    },
    get: function () {
      const val = this[innerPropSymbol];
      if (!subscriber) {
        return val;
      }
      const observersKey = getObserversKey(this, key);
      let currentObservers = observers.get(observersKey);
      if (!currentObservers) {
        currentObservers = [];
        observers.set(observersKey, currentObservers);
      }
      if (currentObservers.includes(subscriber)) {
        return val;
      }
      currentObservers.push(subscriber);
      return val;
    },
    enumerable: true,
    configurable: true
  };
}

const unique = <T>(arr: T[]): T[] => {
  return arr.reduce((prev: T[], cur) => {
    if (!prev.includes(cur)) {
      prev.push(cur);
    }
    return prev;
  }, []);
};
export function action(
  target: any,
  key: string | symbol,
  descriptor: PropertyDescriptor
): any {
  if (descriptor === undefined) {
    descriptor = Object.getOwnPropertyDescriptor(target, key)!;
  }
  var originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const isNotInitialAction = isInsideAction;
    isInsideAction = true;
    var result = originalMethod.apply(this, args);
    isInsideAction = isNotInitialAction;
    if (!isNotInitialAction) {
      unique(subscribersToRun).forEach(c => {
        runSubscriber(c);
      });
      subscribersToRun = [];
    }
    return result;
  };
  return descriptor;
}

export function autoRun(callback: () => void) {
  runSubscriber(callback);
}
