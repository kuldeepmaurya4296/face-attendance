import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const users = await User.find({ face_embeddings: { $exists: true, $ne: [] } })
                            .select('_id name email face_embeddings');
    
    const gallery = users.map(u => ({
      user_id: u._id.toString(),
      embeddings: u.face_embeddings,
      name: u.name
    }));
    
    return NextResponse.json(gallery);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
