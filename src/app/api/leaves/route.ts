import { NextRequest, NextResponse } from 'next/server';
import Leave from '@/models/Leave';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();
    const { from_date, to_date, reason } = await req.json();
    const leave = new Leave({ user_id: authResult.user._id, from_date, to_date, reason });
    await leave.save();
    return NextResponse.json({ message: 'Leave applied', leave }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();
    let filter: any = {};
    if (authResult.user.role === 'User' || authResult.user.role === 'Employee' || authResult.user.role === 'Student') {
      filter.user_id = authResult.user._id;
    }
    const leaves = await Leave.find(filter).populate('user_id', 'name email role');
    return NextResponse.json(leaves);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
