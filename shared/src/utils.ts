// Thanks to https://stackoverflow.com/a/38340374/1093712
export function removeUndefined(obj: any): any {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
}

/** Copies all fields to a new object, except `id`, and undefined fields. */
export function copyFields<U>(data: U, except: string[] = ['id']): U {
  const obj: any = Object.assign({}, data);
  for (const key of except) {
    delete obj[key];
  }
  return removeUndefined(obj);
}

/** Copies all fields to a new object, except `id`, and undefined fields. */
export function copyFields2<U, V>(
  data: U, data2: V, except: string[] = ['id'],
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