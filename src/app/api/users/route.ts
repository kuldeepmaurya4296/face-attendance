import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner', 'SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();
    const filter: any = {};
    if (authResult.user.role !== 'Owner' && authResult.user.company_id) {
      filter.company_id = authResult.user.company_id;
    }

    const users = await User.find(filter).select('-password');
    const sanitized = users.map(u => {
      const obj = u.toObject();
      obj.has_face_id = !!(obj.face_embeddings && obj.face_embeddings.length > 0);
      delete obj.face_embeddings;
      return obj;
    });

    return NextResponse.json(sanitized);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
