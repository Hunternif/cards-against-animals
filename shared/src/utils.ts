// Thanks to https://stackoverflow.com/a/38340374/1093712
export function removeUndefined(obj: any): any {
  Object.keys(obj).forEach((key) => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
}

/**Copies all fields to a new object, except `id`, and underfined fields */
export function copyFields<U>(data: U): U {
  const obj: any = Object.assign({}, data);
  delete obj['id'];
  return removeUndefined(obj);
}

/**Copies all fields to a new object, except `id` */
export function copyFields2<U, V>(data: U, data2: V): U & V {
  const obj: any = Object.assign({}, data, data2);
  delete obj['id'];
  return removeUndefined(obj);
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 * From https://stackoverflow.com/a/1527820/1093712
 */
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}