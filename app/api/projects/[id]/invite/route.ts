import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = id;
  const { userId } = await request.json(); // User ID to invite

  try {
    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if already a member
    const isMember = project.members.some((m: any) => m.id === userId) || project.userId === userId;
    if (isMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Add member
    await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: { id: userId }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Invite failed' }, { status: 500 });
  }
}
