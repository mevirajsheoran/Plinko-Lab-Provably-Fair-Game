// src/app/api/rounds/[id]/reveal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const round = await prisma.round.findUnique({
      where: { id: params.id },
    });

    if (!round) {
      return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    }

    if (round.status === 'CREATED') {
      return NextResponse.json(
        { error: 'Round has not started yet' },
        { status: 400 }
      );
    }

    if (round.status === 'REVEALED') {
      return NextResponse.json({
        serverSeed: round.serverSeed,
        message: 'Round already revealed',
      });
    }

    // Update to revealed status
    const updatedRound = await prisma.round.update({
      where: { id: params.id },
      data: {
        status: 'REVEALED',
        revealedAt: new Date(),
      },
    });

    return NextResponse.json({
      serverSeed: updatedRound.serverSeed,
    });
  } catch (error) {
    console.error('Error revealing round:', error);
    return NextResponse.json(
      { error: 'Failed to reveal round' },
      { status: 500 }
    );
  }
}