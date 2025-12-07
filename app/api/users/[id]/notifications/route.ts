
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: id },
      include: {
        message: {
          include: {
            user: { select: { name: true, avatar: true } },
            candidate: { select: { id: true, text: true } },
            project: { select: { id: true, title: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Notifications GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params; // userId
  const body = await request.json();
  const { notificationIds } = body;

  try {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: id
      },
      data: { read: true }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Notifications PUT Error:", error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
