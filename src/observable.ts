import { createObservableArray } from "./observable-array";

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

const onPropertyValueChange = (propertyObserversKey: string): void => {
  const propertyObservers = observers.get(propertyObserversKey);
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
};
const onSubscribe = (propertyObserversKey: string): void => {
  if (!subscriber) {
    return;
  }
  let currentObservers = observers.get(propertyObserversKey);
  if (!currentObservers) {
    currentObservers = createObserversMap();
    observers.set(propertyObserversKey, currentObservers);
  }

  if (
    [...currentObservers].some(([scope, o]) => o.callback === subscriber) ||
    currentScopeId == null
  ) {
    return;
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
};
export function observable(target: any, key: string | symbol): any {
  const innerPropSymbol = Symbol(key.toString());
  return {
    set: function(value: any) {
      let convertedValue = value;
      if (!hasProp(target, idSymbol)) {
        defineInnerKey(target);
      }
      if (!hasProp(target, innerPropSymbol)) {
        defineInnerPropertyValue(target, innerPropSymbol, value);
      }
      if (Array.isArray(value)) {
        const fieldKey = getObserversKey(target, key) + "array";
        convertedValue = createObservableArray(
          convertedValue,
          () => onPropertyValueChange(fieldKey),
          () => onSubscribe(fieldKey)
        );
      }
      target[innerPropSymbol] = convertedValue;
      onPropertyValueChange(getObserversKey(target, key));
    },
    get: function() {
      let val = target[innerPropSymbol];
      const observersKey = getObserversKey(target, key);
      onSubscribe(observersKey);
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
  this: any,
  target: any,
  key: string | symbol,
  descriptor?: PropertyDescriptor
): any {
  const originalMethod = () =>
    descriptor == null ? target[key] : descriptor.value;
  const buildResultMethod = (originalMethodGetter: () => any) => (
    ...args: any[]
  ) => {
    const isNotInitialAction = isInsideAction;
    isInsideAction = true;
    const original = originalMethodGetter();
    var result = original.apply(this, args);
    isInsideAction = isNotInitialAction;
    if (!isNotInitialAction) {
      unique(subscribersToRun).forEach(c => {
        runSubscriber(c);
      });
      subscribersToRun = [];
    }
    return result;
  };
  let resultMethod = buildResultMethod(originalMethod);
  if (descriptor != null) {
    descriptor.value = resultMethod;
    return descriptor;
  }
  return {
    configurable: true,
    enumerable: true,
    get: () => {
      return resultMethod;
    },
    set: (value: any) => {
      resultMethod = buildResultMethod(() => value);
    }
  };
}

export function autoRun(callback: () => void) {
  runSubscriber(callback);
}
