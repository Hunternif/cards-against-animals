// Thanks to https://stackoverflow.com/a/38340374/1093712
export function removeUndefined(obj: any): any {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
}

/**
 * Copies all fields to a new object, except `id`, and undefined fields.
 * Creates a shallow copy.
 */
export function copyFields<U>(data: U, except: string[] = ['id']): U {
  const obj: any = Object.assign({}, data);
  for (const key of except) {
    delete obj[key];
  }
  return removeUndefined(obj);
}

/**
 * Copies all fields to a new object, except `id`, and undefined fields.
 * Creates a shallow copy.
 */
export function copyFields2<U, V>(
  data: U,
  data2: V,
  except: string[] = ['id'],
): U & V {
  const obj: any = Object.assign({}, data, data2);
  for (const key of except) {
    delete obj[key];
  }
  return removeUndefined(obj);
}

/** Put this in your switch 'default' block */
export function assertExhaustive(val: never) {
  throw new Error(`Unhandled value ${val}`);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function stringComparator(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Maps plain JS object to a ES6 Map.
 * @param obj
 * @param mapper optional mapper function to convert values.
 */
export function objectToMap<T>(
  obj: any,
  mapper?: (val: any) => T,
): Map<string, T> {
  const map = new Map<string, T>();
  for (const [key, val] of Object.entries(obj)) {
    if (mapper) map.set(key, mapper(val));
    else map.set(key, val as T);
  }
  return map;
}

/**
 * Maps ES6 Map to a plain JS object.
 * @param map must have string keys.
 * @param mapper optional mapper function to convert values.
 */
export function mapToObject<T>(
  map: Map<string, T>,
  mapper?: (val: T) => any,
): any {
  const out: any = {};
  for (const [key, val] of map) {
    if (mapper) out[key] = mapper(val);
    else out[key] = val;
  }
  return out;
}

/** Function `fn` will be called only after `timeMs` has elapsed
 * since the last invocation. */
export function debounce(
  fn: (...args: any[]) => void,
  timeMs: number = 1000,
): (...args: any[]) => Promise<void> {
  let timeout: any; // any because NodeJS uses a custom type here.
  return function (...args: any[]) {
    return new Promise((resolve, error) => {
      if (timeout > 0) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        try {
          resolve(fn(...args));
        } catch (e: any) {
          error(e);
        }
      }, timeMs);
    });
  };
}
