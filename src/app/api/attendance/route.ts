import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();
    const records = await Attendance.find({ user_id: authResult.user._id })
      .sort({ date: -1 })
      .limit(50);

    return NextResponse.json(records);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
