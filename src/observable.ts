interface Observer {
  callback: (() => void);
  depth: number;
}

type ObserversScopesMap = Map<number, Observer>;
const createObserversMap = () => new Map<number, Observer>();

const observers = new Map<string, ObserversScopesMap>();

let count = 0;
let isInsideAction = false;
let subscribersToRun: (() => void)[] = [];
let subscriber: (() => void) | null = null;

const idSymbol = Symbol("id");
let currentScopeId: number | null = null;
let depth = 0;
let lastScopeId = 0;

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
  const isBeginOfScope = currentScopeId === null;
  if (isBeginOfScope) {
    lastScopeId++;
    currentScopeId = lastScopeId;
  }
  const initialSubscriber = subscriber;
  subscriber = callback;
  depth++;
  callback();
  depth--;
  subscriber = initialSubscriber;
  if (isBeginOfScope) {
    currentScopeId = null;
  }
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
    set: function(value: any) {
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
      propertyObservers!.forEach(observer => {
        if (isInsideAction) {
          subscribersToRun.push(observer.callback);
          return;
        }
        runSubscriber(observer.callback);
      });
    },
    get: function() {
      const val = this[innerPropSymbol];
      if (!subscriber) {
        return val;
      }
      const observersKey = getObserversKey(this, key);
      let currentObservers = observers.get(observersKey);
      if (!currentObservers) {
        currentObservers = createObserversMap();
        observers.set(observersKey, currentObservers);
      }

      if (
        [...currentObservers].some(([scope, o]) => o.callback === subscriber) ||
        currentScopeId == null
      ) {
        return val;
      }
      const existingScopedObserver = currentObservers.get(currentScopeId);
      if (
        existingScopedObserver != undefined &&
        existingScopedObserver.depth <= depth
      ) {
        return;
      }
      currentObservers.set(currentScopeId, {
        callback: subscriber,
        depth
      });
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

  descriptor.value = function(...args: any[]) {
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
