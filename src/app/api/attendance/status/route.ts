import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import Company from '@/models/Company';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';
import { buildConfig, canCheckout } from '@/lib/services/attendance-engine';
import { appLog } from '@/lib/services/logger';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });

    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ user_id: authResult.user._id, date: today });
    const company = await Company.findById(authResult.user.company_id);
    
    const config = buildConfig(company?.settings || {}, company?.org_type || 'Company');

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
      allow_self_checkin: company?.settings?.allow_self_checkin || false,
      attendance_mode: company?.settings?.attendance_mode || 'KIOSK',
      shift_start: config.shift_start,
      shift_end: config.shift_end,
      min_checkout_hours: config.min_checkout_hours,
      can_checkout: false,
      remaining_minutes_for_checkout: 0,
      is_valid_checkout: true,
      early_exit_reason: ''
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
      result.is_valid_checkout = record.is_valid_checkout !== false;
      result.early_exit_reason = record.early_exit_reason || '';

      if (record.check_in && !record.check_out) {
        const checkoutInfo = canCheckout(new Date(record.check_in), new Date(), config.min_checkout_hours);
        result.can_checkout = checkoutInfo.can_checkout;
        result.remaining_minutes_for_checkout = checkoutInfo.remaining_minutes;

        const elapsed = (Date.now() - new Date(record.check_in).getTime()) / 3600000;
        result.elapsed_hours = parseFloat(elapsed.toFixed(2));
      } else if (record.check_out) {
        result.can_checkout = true; // Already checked out
      }
    } else {
      // Not checked in yet
      result.can_checkout = false;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    appLog.error('ATTENDANCE_STATUS_ERROR', { error: err.message });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
