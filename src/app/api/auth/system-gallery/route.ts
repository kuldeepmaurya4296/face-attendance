import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { safeDecryptEmbeddings } from '@/lib/services/encryption';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const users = await User.find({ face_embeddings: { $exists: true, $ne: [] } })
                            .select('_id name email face_embeddings');
    
    const gallery = users.map(u => ({
      user_id: u._id.toString(),
      embeddings: safeDecryptEmbeddings(u.face_embeddings),
      name: u.name
    })).filter(item => item.embeddings && item.embeddings.length > 0);
    
    return NextResponse.json(gallery);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
