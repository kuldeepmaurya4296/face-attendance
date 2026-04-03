import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const existingUser = await User.findById(id);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    if (existingUser.face_embeddings && existingUser.face_embeddings.length > 0) {
      return NextResponse.json({ error: 'Face ID already registered. Each user can only have one Face ID.' }, { status: 400 });
    }

    const { embeddings } = await req.json();
    const user = await User.findByIdAndUpdate(
      id,
      { face_embeddings: embeddings },
      { new: true }
    ).select('-password');

    return NextResponse.json({ message: 'Face registered successfully', user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
