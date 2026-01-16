// tests/prng.test.ts
import { createXorshift32, seedFromHex, roundTo } from '../src/lib/prng';

describe('PRNG', () => {
  describe('seedFromHex', () => {
    it('should extract first 4 bytes as big-endian integer', () => {
      const hex = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
      const seed = seedFromHex(hex);
      expect(seed).toBe(0xe1dddf77);
    });
  });

  describe('createXorshift32', () => {
    it('should produce deterministic sequence from test vector', () => {
      // combinedSeed from test vector
      const combinedSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
      const seed = seedFromHex(combinedSeed);
      const rand = createXorshift32(seed);


      // Expected values from test vector
      const expected = [
        0.1106166649,
        0.7625129214,
        0.0439292176,
        0.4578678815,
        0.3438999297,
      ];

      for (let i = 0; i < expected.length; i++) {
        const value = roundTo(rand(), 10);
        expect(value).toBeCloseTo(expected[i], 8);
      }
    });

    it('should handle zero seed by using 1', () => {
      const rand = createXorshift32(0);
      const value = rand();
      expect(value).toBeGreaterThan(0);
      expect(value).toBeLessThan(1);
    });

    it('should produce values in [0, 1) range', () => {
      const rand = createXorshift32(12345);
      for (let i = 0; i < 1000; i++) {
        const value = rand();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('roundTo', () => {
    it('should round to specified decimal places', () => {
      expect(roundTo(0.123456789, 6)).toBe(0.123457);
      expect(roundTo(0.5555555, 4)).toBe(0.5556);
      expect(roundTo(0.999999999, 2)).toBe(1);
    });
  });
});