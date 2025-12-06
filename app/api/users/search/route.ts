import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const currentUserId = searchParams.get('currentUserId');

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query } }, // Case-insensitive in some DBs, SQLite is strictly case-sensitive usually involving raw query for CI, but contains is okay for MVP
              { email: { contains: query } }
            ]
          },
          { id: { not: currentUserId || '' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      },
      take: 5
    });

    return NextResponse.json({ users });
  } catch (e) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
