// src/app/api/rounds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const rounds = await prisma.round.findMany({
      where: { status: 'REVEALED' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        createdAt: true,
        status: true,
        nonce: true,
        commitHex: true,
        clientSeed: true,
        pegMapHash: true,
        dropColumn: true,
        binIndex: true,
        payoutMultiplier: true,
        betCents: true,
        serverSeed: true,
      },
    });

    return NextResponse.json(rounds);
  } catch (error) {
    console.error('Error fetching rounds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rounds' },
      { status: 500 }
    );
  }
}