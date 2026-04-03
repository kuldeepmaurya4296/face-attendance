import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';

// GET own profile
export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();
    const user = await User.findById(authResult.user._id).select('-password -face_embeddings').lean();
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      ...user,
      has_face_id: !!(authResult.user.face_embeddings?.length > 0),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT update own profile
export async function PUT(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();
    const { name, phone, password } = await req.json();

    const update: any = {};
    if (name) update.name = name;
    if (phone !== undefined) update.phone = phone;

    if (password) {
      // In production, hash the password. For now, store directly as the existing system does.
      update.password = password;
    }

    const user = await User.findByIdAndUpdate(authResult.user._id, update, { new: true })
      .select('-password -face_embeddings');

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
