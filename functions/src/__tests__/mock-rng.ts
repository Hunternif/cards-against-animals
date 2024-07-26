import { RNG } from '../shared/rng';

/** Returns a callback that resets it back to original */
export function mockRNG(): () => void {
  const original = RNG.prototype.randomInt;

  let counter = 0;
  RNG.prototype.randomInt = () => {
    counter += 1;
    return counter;
  };

  return () => {
    RNG.prototype.randomInt = original;
  };
}
