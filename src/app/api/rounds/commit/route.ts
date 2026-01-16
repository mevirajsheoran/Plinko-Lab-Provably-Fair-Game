// src/app/api/rounds/commit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateRandomHex, generateCommitHex } from '@/lib/crypto';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Generate server-side values
    const serverSeed = generateRandomHex(32);
    const nonce = uuidv4();
    const commitHex = generateCommitHex(serverSeed, nonce);

    // Create round in database
    const round = await prisma.round.create({
      data: {
        status: 'CREATED',
        nonce,
        commitHex,
        serverSeed, // Stored but not revealed yet
        rows: 12,
      },
    });

    // Return only public data
    return NextResponse.json({
      roundId: round.id,
      commitHex: round.commitHex,
      nonce: round.nonce,
    });
  } catch (error) {
    console.error('Error creating round:', error);
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 }
    );
  }
}