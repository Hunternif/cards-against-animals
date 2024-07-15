import { expect, test } from 'vitest';
import { countEveryN, mapToObject, objectToMap } from '../../shared/utils';

test('convert object to Map', () => {
  const obj = { foo: { bar: 'baz' } };
  const map = objectToMap<{ bar: string }>(obj);
  expect(map.get('foo')).toEqual({ bar: 'baz' });
});

test('convert object to Map with mapper', () => {
  const obj = { foo: { bar: 'baz' } };
  const mapper = (input: any) =>
    Object.assign(input, {
      fizz: 'buzz',
    });
  const map = objectToMap<{ bar: string }>(obj, mapper);
  expect(map.get('foo')).toEqual({ bar: 'baz', fizz: 'buzz' });
});

test('convert Map to object', () => {
  const map = new Map([['foo', { bar: 'baz' }]]);
  const obj = mapToObject<{ bar: string }>(map);
  expect(obj.foo).toEqual({ bar: 'baz' });
});

test('convert Map to object with mapper', () => {
  const map = new Map([['foo', { bar: 'baz' }]]);
  const mapper = (input: any) =>
    Object.assign(input, {
      fizz: 'buzz',
    });
  const obj = mapToObject<{ bar: string }>(map, mapper);
  expect(obj.foo).toEqual({ bar: 'baz', fizz: 'buzz' });
});

test('count every N things', () => {
  expect(countEveryN(0, 1, 5)).toBe(0);
  expect(countEveryN(1, 2, 5)).toBe(0);
  expect(countEveryN(2, 4, 5)).toBe(0);
  expect(countEveryN(4, 5, 5)).toBe(1);
  expect(countEveryN(5, 5, 5)).toBe(0);
  expect(countEveryN(6, 5, 5)).toBe(0); // invalid
  expect(countEveryN(0, 5, 5)).toBe(1);
  expect(countEveryN(0, 10, 5)).toBe(2);
  expect(countEveryN(0, 11, 5)).toBe(2);
  expect(countEveryN(5, 11, 5)).toBe(1);
  expect(countEveryN(9, 11, 5)).toBe(1);
  expect(countEveryN(10, 11, 5)).toBe(0);
  expect(countEveryN(24, 35, 5)).toBe(3);
});
