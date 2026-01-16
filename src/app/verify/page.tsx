// src/app/verify/page.tsx
import Link from 'next/link';
import VerifierForm from '@/components/VerifierForm';

export const metadata = {
  title: 'Verify Round - Plinko',
  description: 'Verify the fairness of any Plinko round',
};

export default function VerifyPage() {
  return (
    <main className="min-h-screen p-4 md:p-8 bg-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🔍 Round Verifier
          </h1>
          <Link
            href="/"
            className="px-4 py-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
          >
            ← Back to Game
          </Link>
        </header>

        <div className="bg-slate-800/50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-3">
            How Provably Fair Works
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
            <li>
              Before each round, the server generates a <code className="bg-slate-700 px-1 rounded">serverSeed</code> and{' '}
              <code className="bg-slate-700 px-1 rounded">nonce</code>
            </li>
            <li>
              Only the hash (<code className="bg-slate-700 px-1 rounded">commitHex</code>) is shown to you before the game
            </li>
            <li>
              You provide your own <code className="bg-slate-700 px-1 rounded">clientSeed</code> (or one is auto-generated)
            </li>
            <li>
              The outcome is determined by{' '}
              <code className="bg-slate-700 px-1 rounded">
                SHA256(serverSeed:clientSeed:nonce)
              </code>
            </li>
            <li>
              After the round, you can verify the <code className="bg-slate-700 px-1 rounded">serverSeed</code> matches the original commit
            </li>
          </ol>
        </div>

        <VerifierForm />

        <div className="mt-8 bg-slate-800/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Test Vector</h2>
          <p className="text-slate-400 text-sm mb-4">
            Use these values to verify the implementation matches the specification:
          </p>
          <div className="text-sm font-mono bg-slate-900 p-4 rounded overflow-x-auto">
            <pre className="text-slate-300 whitespace-pre-wrap">
{`serverSeed: b2a5f3f32a4d9c6ee7a8c1d33456677890abcdeffedcba0987654321ffeeddcc
clientSeed: candidate-hello
nonce: 42
dropColumn: 6

Expected Results:
  commitHex:    bb9acdc67f3f18f3345236a01f0e5072596657a9005c7d8a22cff061451a6b34
  combinedSeed: e1dddf77de27d395ea2be2ed49aa2a59bd6bf12ee8d350c16c008abd406c07e0
  binIndex:     6`}
            </pre>
          </div>
        </div>

        <footer className="mt-8 text-center text-sm text-slate-500">
          <p>All game outcomes are cryptographically verifiable.</p>
        </footer>
      </div>
    </main>
  );
}