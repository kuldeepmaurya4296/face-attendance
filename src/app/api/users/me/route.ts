import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';

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
