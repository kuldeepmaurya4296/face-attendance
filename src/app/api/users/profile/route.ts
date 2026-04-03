import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import Company from '@/models/Company';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();
    const user = await User.findById(authResult.user._id).select('-password -face_embeddings');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let company = null;
    if (user.company_id) {
      company = await Company.findById(user.company_id).select('name org_type plan status');
    }

    const userObj = user.toObject();
    userObj.has_face_id = !!(authResult.user.face_embeddings?.length > 0 ||
      (await User.findById(authResult.user._id).select('face_embeddings'))?.face_embeddings?.length > 0);

    return NextResponse.json({ user: userObj, company });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();
    const body = await req.json();

    // Allowed fields to update
    const allowedFields = ['name', 'email', 'phone', 'password', 'face_embeddings'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== '') {
        updateData[field] = body[field];
      }
    }

    // Check email uniqueness if changing email
    if (updateData.email) {
      const existing = await User.findOne({ email: updateData.email, _id: { $ne: authResult.user._id } });
      if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const user = await User.findByIdAndUpdate(authResult.user._id, updateData, { new: true }).select('-face_embeddings');
    return NextResponse.json({ message: 'Profile updated', user });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
