import { expect, test } from 'vitest';
import { mapToObject, objectToMap } from '../../shared/utils';

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
