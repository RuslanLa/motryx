const isIndex = (property: number | any): boolean => {
  return typeof property === "number" || !isNaN(property);
};
export const createObservableArray = <T>(
  arr: T[],
  onChange: () => void,
  onSubscribe: () => void
): T[] => {
  return new Proxy(arr, {
    set: (
      target: T[],
      property: string | symbol | number,
      value: any
    ): boolean => {
      if (isIndex(property)) {
        Reflect.set(target, property, value);
        onChange();
      }
      return true;
    },
    get: (target: T[], property: string | symbol | number): any => {
      if (isIndex(property) || property === "length") {
        onSubscribe();
      }
      return Reflect.get(target, property);
    }
  });
};
