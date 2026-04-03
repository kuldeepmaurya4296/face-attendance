import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const company_id = authResult.user.company_id;
    if (!company_id) {
      return NextResponse.json({ error: 'No company associated with this user.' }, { status: 400 });
    }

    await connectDB();
    const records = await Attendance.find({ company_id })
      .populate('user_id', 'name email department')
      .sort({ date: -1, check_in: -1 })
      .limit(200);
    
    return NextResponse.json(records);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
