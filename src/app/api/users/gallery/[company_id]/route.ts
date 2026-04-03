import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ company_id: string }> }) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner', 'SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const resolvedParams = await params;
    const { company_id } = resolvedParams;

    await connectDB();
    const users = await User.find({ 
      company_id, 
      face_embeddings: { $exists: true, $ne: [] } 
    }).select('_id name email face_embeddings');
    
    const gallery = users.map(u => ({
      user_id: u._id.toString(),
      name: u.name,
      email: u.email,
      embeddings: u.face_embeddings
    }));
    
    return NextResponse.json(gallery);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
