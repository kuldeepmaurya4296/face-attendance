import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password, role, company_id, face_embeddings, department } = await req.json();
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });

    if (['User', 'Admin', 'Employee', 'Student'].includes(role) && (!face_embeddings || face_embeddings.length === 0)) {
      return NextResponse.json({ error: 'Face ID is required for registration.' }, { status: 400 });
    }

    const user = new User({ 
      name, email, password, role, company_id, face_embeddings, department 
    });
    await user.save();

    return NextResponse.json({ message: 'User registered successfully', user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
