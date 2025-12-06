import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Get list of projects for a user
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'UserId required' }, { status: 400 });
  }

  try {
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { userId },
          { members: { some: { id: userId } } }
        ]
      },
      include: {
        owner: { select: { name: true, email: true } },
        members: { select: { id: true } } // needed for count or logic
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({ projects });
  } catch (e) {
    console.error("Projects GET error:", e);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// Create new project
export async function POST(request: Request) {
  try {
    const { userId, title } = await request.json();

    const project = await prisma.project.create({
      data: {
        userId,
        title: title || 'New Think Bigger Project',
        problemStatement: '',
      }
    });

    return NextResponse.json({ project });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
