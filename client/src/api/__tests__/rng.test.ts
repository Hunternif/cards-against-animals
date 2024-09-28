import { expect, test } from 'vitest';
import { RNG } from '../../shared/rng';

test('fair random distribution', () => {
  const results = new Array<number>(10).fill(0);
  const rng = RNG.fromIntSeed(12345);
  for (let i = 0; i < 10000; i++) {
    const idx = rng.randomIntClamped(0, 9);
    results[idx]++;
  }
  for (let i = 0; i < 10; i++) {
    expect(results[i]).to.above(900);
  }
  console.info(results);
});

test('choose random item according to its weight', () => {
  const a = { val: 'a', weight: 6 };
  const b = { val: 'b', weight: 1 };
  const c = { val: 'c', weight: 3 };

  const hits = new Map<string, number>();
  const rng = RNG.fromIntSeed(3333);

  for (let i = 0; i < 10000; i++) {
    const result = rng.chooseWeighted([a, b, c]);
    if (result) hits.set(result, (hits.get(result) ?? 0) + 1);
  }

  // Compare with some reasonable delta
  expect(hits.get('a')).toBeGreaterThan(6000 - 50);
  expect(hits.get('b')).toBeGreaterThan(1000 - 50);
  expect(hits.get('c')).toBeGreaterThan(3000 - 50);
});

test('choose weighted item, but some weights are 0', () => {
  const a = { val: 'a', weight: 0 };
  const b = { val: 'b', weight: 1 };
  const c = { val: 'c', weight: 0 };

  const hits = new Map<string, number>();
  const rng = RNG.fromIntSeed(1);

  for (let i = 0; i < 10000; i++) {
    const result = rng.chooseWeighted([a, b, c]);
    if (result) hits.set(result, (hits.get(result) ?? 0) + 1);
  }

  // Compare with some reasonable delta
  expect(hits.get('a')).toEqual(undefined);
  expect(hits.get('b')).toEqual(10000);
  expect(hits.get('c')).toEqual(undefined);
});
