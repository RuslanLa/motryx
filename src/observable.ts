const observers = new Map<number, (() => void)[]>();

let count = 0;
let subscriber: (() => void) | null = null;
export function observable(target: any, key: string | symbol): any {
  let val: any = target[key];
  let propId = count;
  count += 1;
  observers.set(propId, []);
  return {
    set: function(value: any) {
      val = value;
      if (!observers.get(propId)) {
        return;
      }
      observers.get(propId)!.forEach(callback => {
        subscriber = callback;
        callback();
      });
    },
    get: function() {
      if (!subscriber) {
        return val;
      }
      let currentObservers = observers.get(propId)!;
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

export function autoRun(callback: () => void) {
  subscriber = callback;
  callback();
  subscriber = null;
}
