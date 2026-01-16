// __tests__/engine.test.ts
import { runGame, generatePegMap, simulateDrop, verifyRound } from '../src/lib/engine';
import { createXorshift32, seedFromHex, roundTo } from '../src/lib/prng';
import { generateCombinedSeed } from '../src/lib/crypto';

describe('Engine', () => {
  const testVector = {
    serverSeed: 'b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc',
    clientSeed: 'candidate-hello',
    nonce: '42',
    dropColumn: 6,
  };

  describe('generatePegMap', () => {
    it('should generate correct peg map from test vector', () => {
      const combinedSeed = generateCombinedSeed(
        testVector.serverSeed,
        testVector.clientSeed,
        testVector.nonce
      );
      const seed = seedFromHex(combinedSeed);
      const rand = createXorshift32(seed);
      const pegMap = generatePegMap(rand);

      // Check first few rows match expected
      expect(pegMap.map[0][0]).toBeCloseTo(0.422123, 5);
      expect(pegMap.map[1][0]).toBeCloseTo(0.552503, 5);
      expect(pegMap.map[1][1]).toBeCloseTo(0.408786, 5);
    });

    it('should generate 12 rows', () => {
      const rand = createXorshift32(12345);
      const pegMap = generatePegMap(rand);
      expect(pegMap.map.length).toBe(12);
    });

    it('should have correct number of pegs per row', () => {
      const rand = createXorshift32(12345);
      const pegMap = generatePegMap(rand);
      for (let row = 0; row < 12; row++) {
        expect(pegMap.map[row].length).toBe(row + 1);
      }
    });

    it('should generate biases in [0.4, 0.6] range', () => {
      const rand = createXorshift32(12345);
      const pegMap = generatePegMap(rand);
      for (const row of pegMap.map) {
        for (const bias of row) {
          expect(bias).toBeGreaterThanOrEqual(0.4);
          expect(bias).toBeLessThanOrEqual(0.6);
        }
      }
    });
  });

  describe('runGame', () => {
    it('should return binIndex 6 for center drop with test vector', () => {
      const result = runGame(
        testVector.serverSeed,
        testVector.clientSeed,
        testVector.nonce,
        testVector.dropColumn
      );

      expect(result.binIndex).toBe(6);
    });

    it('should return a valid path with 12 decisions', () => {
      const result = runGame(
        testVector.serverSeed,
        testVector.clientSeed,
        testVector.nonce,
        testVector.dropColumn
      );

      expect(result.path.length).toBe(12);
      result.path.forEach((decision, i) => {
        expect(decision.row).toBe(i);
        expect(typeof decision.wentRight).toBe('boolean');
        expect(decision.posAfter).toBeGreaterThanOrEqual(0);
        expect(decision.posAfter).toBeLessThanOrEqual(i + 1);
      });
    });

    it('should produce deterministic results', () => {
      const result1 = runGame(
        testVector.serverSeed,
        testVector.clientSeed,
        testVector.nonce,
        testVector.dropColumn
      );

      const result2 = runGame(
        testVector.serverSeed,
        testVector.clientSeed,
        testVector.nonce,
        testVector.dropColumn
      );

      expect(result1.binIndex).toBe(result2.binIndex);
      expect(result1.pegMap.hash).toBe(result2.pegMap.hash);
      expect(JSON.stringify(result1.path)).toBe(JSON.stringify(result2.path));
    });

    it('should return binIndex in valid range [0, 12]', () => {
      for (let i = 0; i < 20; i++) {
        const result = runGame(
          `seed${i}`,
          'client',
          `${i}`,
          6
        );
        expect(result.binIndex).toBeGreaterThanOrEqual(0);
        expect(result.binIndex).toBeLessThanOrEqual(12);
      }
    });
  });

  describe('verifyRound', () => {
    it('should return matching commit hash', () => {
      const result = verifyRound(
        testVector.serverSeed,
        testVector.clientSeed,
        testVector.nonce,
        testVector.dropColumn
      );

      expect(result.commitHex).toBe('bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34');
    });

    it('should return matching combined seed', () => {
      const result = verifyRound(
        testVector.serverSeed,
        testVector.clientSeed,
        testVector.nonce,
        testVector.dropColumn
      );

      expect(result.combinedSeed).toBe('e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0');
    });

    it('should return binIndex 6 for test vector', () => {
      const result = verifyRound(
        testVector.serverSeed,
        testVector.clientSeed,
        testVector.nonce,
        testVector.dropColumn
      );

      expect(result.binIndex).toBe(6);
    });
  });

  describe('drop column influence', () => {
    it('should shift results based on drop column', () => {
      const leftResults: number[] = [];
      const rightResults: number[] = [];

      // Run multiple games with left column
      for (let i = 0; i < 100; i++) {
        const result = runGame(`seed${i}`, 'client', `${i}`, 0);
        leftResults.push(result.binIndex);
      }

      // Run multiple games with right column
      for (let i = 0; i < 100; i++) {
        const result = runGame(`seed${i}`, 'client', `${i}`, 12);
        rightResults.push(result.binIndex);
      }

      const leftAvg = leftResults.reduce((a, b) => a + b, 0) / leftResults.length;
      const rightAvg = rightResults.reduce((a, b) => a + b, 0) / rightResults.length;

      // Right column should produce higher bin indices on average
      expect(rightAvg).toBeGreaterThan(leftAvg);
    });
  });
});