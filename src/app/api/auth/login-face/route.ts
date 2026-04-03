import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { user_id } = await req.json();
    const user = await User.findById(user_id);
    
    if (!user) {
      return NextResponse.json({ error: 'User mapping failed' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, company_id: user.company_id }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );

    return NextResponse.json({ message: 'Face ID login successful', token, user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
