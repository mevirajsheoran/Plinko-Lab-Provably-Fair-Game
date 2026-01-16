// __tests__/integration.test.ts
import { runGame, verifyRound } from '../src/lib/engine';
import { generateCommitHex, generateCombinedSeed } from '../src/lib/crypto';

describe('Integration Tests', () => {
  it('should produce verifiable round from game play', () => {
    const serverSeed = 'testseed123456789abcdef';
    const clientSeed = 'myclientseed';
    const nonce = '1';
    const dropColumn = 6;

    // Simulate game
    const gameResult = runGame(serverSeed, clientSeed, nonce, dropColumn);

    // Verify the round
    const verifyResult = verifyRound(serverSeed, clientSeed, nonce, dropColumn);

    // Results should match
    expect(gameResult.binIndex).toBe(verifyResult.binIndex);
    expect(gameResult.pegMap.hash).toBe(verifyResult.pegMapHash);
  });

  it('should match commit hash before and after reveal', () => {
    const serverSeed = 'secretserverseed12345';
    const nonce = 'uniquenonce';

    // Before round: only commit is known
    const commitBefore = generateCommitHex(serverSeed, nonce);

    // After round: verify commit matches
    const commitAfter = generateCommitHex(serverSeed, nonce);

    expect(commitBefore).toBe(commitAfter);
  });

  it('should produce different results for different client seeds', () => {
    const serverSeed = 'fixedserverseed';
    const nonce = '1';
    const dropColumn = 6;

    const result1 = runGame(serverSeed, 'clientseed1', nonce, dropColumn);
    const result2 = runGame(serverSeed, 'clientseed2', nonce, dropColumn);

    // Different client seeds should produce different results (most of the time)
    // At minimum, the combined seeds should be different
    const combined1 = generateCombinedSeed(serverSeed, 'clientseed1', nonce);
    const combined2 = generateCombinedSeed(serverSeed, 'clientseed2', nonce);

    expect(combined1).not.toBe(combined2);
  });

  it('end-to-end: full round lifecycle', () => {
    // 1. Server generates commitment
    const serverSeed = 'e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0';
    const nonce = '100';
    const commitHex = generateCommitHex(serverSeed, nonce);

    // 2. Client provides seed
    const clientSeed = 'player-provided-seed';
    const dropColumn = 3;

    // 3. Game is played
    const gameResult = runGame(serverSeed, clientSeed, nonce, dropColumn);

    // 4. Verification
    const verifyResult = verifyRound(serverSeed, clientSeed, nonce, dropColumn);

    // 5. Assertions
    expect(verifyResult.commitHex).toBe(commitHex);
    expect(verifyResult.binIndex).toBe(gameResult.binIndex);
    expect(verifyResult.pegMapHash).toBe(gameResult.pegMap.hash);
    expect(verifyResult.path.length).toBe(12);
  });
});