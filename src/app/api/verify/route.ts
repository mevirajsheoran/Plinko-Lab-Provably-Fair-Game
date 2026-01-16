// src/app/api/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyRound } from '@/lib/engine';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverSeed = searchParams.get('serverSeed');
    const clientSeed = searchParams.get('clientSeed');
    const nonce = searchParams.get('nonce');
    const dropColumn = parseInt(searchParams.get('dropColumn') || '6');
    const roundId = searchParams.get('roundId');

    if (!serverSeed || !clientSeed || !nonce) {
      return NextResponse.json(
        { error: 'serverSeed, clientSeed, and nonce are required' },
        { status: 400 }
      );
    }

    if (isNaN(dropColumn) || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: 'dropColumn must be between 0 and 12' },
        { status: 400 }
      );
    }

    // Compute verification
    const result = verifyRound(serverSeed, clientSeed, nonce, dropColumn);

    // If roundId provided, check against stored round
    let storedRound = null;
    let isValid = true;

    if (roundId) {
      storedRound = await prisma.round.findUnique({
        where: { id: roundId },
      });

      if (storedRound) {
        isValid =
          storedRound.commitHex === result.commitHex &&
          storedRound.combinedSeed === result.combinedSeed &&
          storedRound.pegMapHash === result.pegMapHash &&
          storedRound.binIndex === result.binIndex;
      }
    }

    return NextResponse.json({
      ...result,
      isValid,
      storedRound: storedRound
        ? {
            id: storedRound.id,
            binIndex: storedRound.binIndex,
            pegMapHash: storedRound.pegMapHash,
            commitHex: storedRound.commitHex,
          }
        : null,
    });
  } catch (error) {
    console.error('Error verifying round:', error);
    return NextResponse.json(
      { error: 'Failed to verify round' },
      { status: 500 }
    );
  }
}