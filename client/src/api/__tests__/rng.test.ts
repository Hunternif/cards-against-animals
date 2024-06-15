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