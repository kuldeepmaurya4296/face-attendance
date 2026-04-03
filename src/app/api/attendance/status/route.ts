import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import Company from '@/models/Company';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ user_id: authResult.user._id, date: today });
    const company = await Company.findById(authResult.user.company_id);
    const settings = company?.settings || {};

    const result: any = {
      checked_in: false,
      checked_out: false,
      check_in_time: null,
      check_out_time: null,
      elapsed_hours: 0,
      status: null,
      is_late: false,
      late_minutes: 0,
      work_hours: 0,
      allow_self_checkin: settings.allow_self_checkin || false,
      attendance_mode: settings.attendance_mode || 'KIOSK',
      shift_start: settings.shift_start || '09:00',
      shift_end: settings.shift_end || '18:00',
    };

    if (record) {
      result.checked_in = !!record.check_in;
      result.checked_out = !!record.check_out;
      result.check_in_time = record.check_in;
      result.check_out_time = record.check_out;
      result.status = record.status;
      result.is_late = record.is_late;
      result.late_minutes = record.late_minutes;
      result.work_hours = record.work_hours;

      if (record.check_in && !record.check_out) {
        const elapsed = (Date.now() - new Date(record.check_in).getTime()) / 3600000;
        result.elapsed_hours = parseFloat(elapsed.toFixed(2));
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
