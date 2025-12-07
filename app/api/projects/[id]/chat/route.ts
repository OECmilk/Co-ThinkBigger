
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const candidateId = searchParams.get('candidateId');

  try {
    const messages = await prisma.message.findMany({
      where: {
        projectId: id,
        candidateId: candidateId || null
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Chat GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id: projectId } = params;
  const body = await request.json();
  const { content, userId, candidateId, mentionedUserIds } = body;

  if (!content || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // Transaction to create message and notifications
    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          content,
          userId,
          projectId,
          candidateId: candidateId || null
        },
        include: {
          user: { select: { id: true, name: true, avatar: true } }
        }
      });

      if (mentionedUserIds && Array.isArray(mentionedUserIds)) {
        for (const targetId of mentionedUserIds) {
          if (targetId !== userId) {
            await tx.notification.create({
              data: {
                userId: targetId,
                messageId: message.id
              }
            });
          }
        }
      }

      return message;
    });

    return NextResponse.json({ message: result });
  } catch (error) {
    console.error("Chat POST Error:", error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
