export interface IRNG {
  /** Returns a random 32-bit integer. */
  randomInt(): number;
}

/**
 * A seeded random number generator.
 * RNG functions copied from https://stackoverflow.com/a/47593316/1093712
 */
export class RNG implements IRNG {
  static maxInt: number = 4294967296;

  /** RNG function, returns random 32-bit integers. */
  private rand: () => number;

  private constructor(seedStr: string) {
    const seed128 = this.cyrb128(seedStr);
    this.rand = this.sfc32(seed128[0], seed128[1], seed128[2], seed128[3]);
  }

  /**
   * Creates a RNG instance using the given seed number.
   * Use this to get a predictable result.
   */
  static fromIntSeed(seedInt: number): RNG {
    return new RNG(seedInt.toString());
  }

  /**
   * Creates a RNG instance using the given seed string.
   * Use this to get a predictable result.
   */
  static fromStrSeed(seedStr: string): RNG {
    return new RNG(seedStr);
  }

  /**
   * Creates a RNG instance using current timestamp as a seed.
   * Use this to get an UNpredictable result.
   */
  static fromTimestamp(): RNG {
    return new RNG(new Date().getMilliseconds().toString());
  }

  /**
   * Creates a RNG instance using the given seed string,
   * also seeded with current timestamp.
   * Use this to get an UNpredictable result.
   */
  static fromStrSeedWithTimestamp(seedStr: string): RNG {
    const timestamp = new Date().getMilliseconds();
    return new RNG(`${seedStr}${timestamp}`);
  }

  /** Returns a random 32-bit integer from 0 to 4294967296. */
  randomInt(): number {
    return this.rand();
  }

  /** Returns a random float from 0 to 1 */
  randomFloat(): number {
    return this.rand() / RNG.maxInt;
  }

  /**
   * Returns a random integer between min (inclusive) and max (inclusive).
   * From https://stackoverflow.com/a/1527820/1093712
   */
  randomIntClamped(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return (Math.floor(this.randomFloat() * (max - min + 1)) + min) >>> 0;
  }

  /**
   * Shuffles the array in place. Using Fisher-Yates (aka Knuth) Shuffle.
   * From https://stackoverflow.com/a/12646864/1093712
   */
  shuffleArray<T>(array: Array<T>) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.randomIntClamped(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  /**
   * Picks one option according to its weight.
   * Weights should be >= 0, arbitrary numbers.
   * At least one option should have weight > 0.
   */
  chooseWeighted<T>(options: Array<{ val: T, weight: number }>): T | undefined {
    if (options.length === 0) return undefined;
    const totalWeight = options.reduce((acc, cur) => acc + cur.weight, 0);
    let toss = this.randomFloat() * totalWeight;
    for (const opt of options) {
      if (opt.weight <= 0) continue;
      toss -= opt.weight;
      if (toss <= 0) return opt.val;
    }
    return undefined;
  }

  /**
   * Creates a RNG function seeded with a.
   * The returned function will yield random 32-bit integers.
   */
  private mulberry32(a: number) {
    return function(): number {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return (t ^ t >>> 14) >>> 0;
    };
  }

  /** Generates a 128-bit seed, as 4 32-bit integers. */
  private cyrb128(str: string) {
    let h1 = 1779033703;
    let h2 = 3144134277;
    let h3 = 1013904242;
    let h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
  }

  /**
   * Creates a RNG function seeded with a, b, c, d.
   * The returned function will yield random 32-bit integers.
   */
  private sfc32(a: number, b: number, c: number, d: number) {
    return function(): number {
      // |= 0 converts to 32-bit integer:
      a |= 0; b |= 0; c |= 0; d |= 0;
      const t = (a + b | 0) + d | 0;
      d = d + 1 | 0;
      a = b ^ b >>> 9;
      b = c + (c << 3) | 0;
      c = (c << 21 | c >>> 11);
      c = c + t | 0;
      return t >>> 0;
    };
  }
}
