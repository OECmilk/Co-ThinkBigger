import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // In a real app, hash the password!
    // const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPassword = password; // WARNING: Demo only

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ error: 'User already exists or error occured' }, { status: 400 });
  }
}
