// src/app/api/rounds/[id]/start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCombinedSeed } from '@/lib/crypto';
import { runGame } from '@/lib/engine';
import { ROWS } from '@/lib/constants';
import { Prisma } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { clientSeed, betCents, dropColumn } = body;

    // Validate inputs
    if (!clientSeed || typeof clientSeed !== 'string') {
      return NextResponse.json(
        { error: 'clientSeed is required' },
        { status: 400 }
      );
    }

    if (typeof dropColumn !== 'number' || dropColumn < 0 || dropColumn > 12) {
      return NextResponse.json(
        { error: 'dropColumn must be between 0 and 12' },
        { status: 400 }
      );
    }

    if (typeof betCents !== 'number' || betCents <= 0) {
      return NextResponse.json(
        { error: 'betCents must be a positive number' },
        { status: 400 }
      );
    }

    const round = await prisma.round.findUnique({
      where: { id: params.id },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status !== 'CREATED') {
      return NextResponse.json(
        { error: 'Round has already started' },
        { status: 400 }
      );
    }

    if (!round.serverSeed) {
      return NextResponse.json(
        { error: 'Invalid round state' },
        { status: 500 }
      );
    }

    const combinedSeed = generateCombinedSeed(
      round.serverSeed,
      clientSeed,
      round.nonce
    );
    
    const result = runGame(
      round.serverSeed,
      clientSeed,
      round.nonce,
      dropColumn
    );

    // Convert path to Prisma-compatible JSON
    // Option 1: Cast to Prisma.InputJsonValue
    const pathData = result.path as unknown as Prisma.InputJsonValue;

    // Update round in database
    const updatedRound = await prisma.round.update({
      where: { id: params.id },
      data: {
        status: 'STARTED',
        clientSeed,
        combinedSeed,
        pegMapHash: result.pegMap.hash,
        dropColumn,
        binIndex: result.binIndex,
        payoutMultiplier: result.payoutMultiplier,
        betCents,
        pathJson: pathData,
      },
    });

    return NextResponse.json({
      roundId: updatedRound.id,
      pegMapHash: result.pegMap.hash,
      rows: ROWS,
      binIndex: result.binIndex,
      payoutMultiplier: result.payoutMultiplier,
      path: result.path,
    });
  } catch (error) {
    console.error('Error starting round:', error);
    return NextResponse.json(
      { error: 'Failed to start round' },
      { status: 500 }
    );
  }
}