import { RNG } from '../shared/rng';
import './mock-rng';
import { mockRNG } from './mock-rng';

test('mock RNG', () => {
  const rng = RNG.fromTimestamp();
  expect(rng.randomInt()).toBeGreaterThan(1);
  const reset = mockRNG();
  expect(rng.randomInt()).toBe(1);
  expect(rng.randomInt()).toBe(2);
  expect(rng.randomInt()).toBe(3);
  reset();
  expect(rng.randomInt()).toBeGreaterThan(3);
});
