import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Company from '@/models/Company';
import Holiday from '@/models/Holiday';
import Leave from '@/models/Leave';
import connectDB from '@/lib/db';
import { 
  computeCheckIn, 
  computeCheckOut, 
  buildConfig, 
  checkoutMessage 
} from '@/lib/services/attendance-engine';
import { markAttendanceSchema, validateInput } from '@/lib/validators';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { validateUserBelongsToCompany } from '@/lib/middleware/tenant';
import { attendanceLog, securityLog, appLog } from '@/lib/services/logger';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`${ip}:attendance_mark`, RATE_LIMITS.ATTENDANCE_MARK);
    if (!rateLimit.allowed) {
      securityLog.rateLimitHit(ip, '/api/attendance/mark');
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    // 2. Body parsing and validation
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = validateInput(markAttendanceSchema, body);
    if (!validation.success) {
      securityLog.invalidInput('/api/attendance/mark', validation.errors);
      return NextResponse.json({ success: false, error: validation.errors[0] }, { status: 400 });
    }

    const { user_id, company_id, mode } = validation.data;

    await connectDB();

    // 3. Tenant Isolation
    const tenantValid = await validateUserBelongsToCompany(user_id, company_id, User);
    if (!tenantValid) {
      securityLog.tenantViolation(user_id, company_id, 'UNKNOWN');
      return NextResponse.json({ success: false, error: 'Unauthorized access' }, { status: 403 });
    }

    const company = await Company.findById(company_id);
    if (!company) {
      return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });
    }

    // 4. Build config from company settings
    const config = buildConfig(company.settings || {}, company.org_type);

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 5. Date exclusions
    const dayOfWeek = now.getDay();
    if (config.weekend_days && config.weekend_days.includes(dayOfWeek)) {
      return NextResponse.json({ success: false, error: 'Today is a weekend. Attendance cannot be marked.' }, { status: 400 });
    }

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const holiday = await Holiday.findOne({
      company_id,
      date: { $gte: today, $lte: todayEnd }
    });
    if (holiday) {
      return NextResponse.json({ success: false, error: `Today is a holiday: ${holiday.name}` }, { status: 400 });
    }

    const approvedLeave = await Leave.findOne({
      user_id,
      status: 'Approved',
      from_date: { $lte: todayEnd },
      to_date: { $gte: today }
    });
    if (approvedLeave) {
      return NextResponse.json({ success: false, error: 'You are on approved leave today.' }, { status: 400 });
    }

    const user = await User.findById(user_id).select('name');
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // 6. DB operations
    const existing = await Attendance.findOne({ user_id, date: today });

    if (existing) {
      // --- CHECKOUT FLOW ---
      if (existing.check_in && !existing.check_out) {
        
        // Anti-abuse: Prevent double checkin triggers too close to each other
        if (now.getTime() - new Date(existing.check_in).getTime() < 30000) {
          attendanceLog.doubleCheckIn(user_id, company_id);
          return NextResponse.json({ success: false, error: 'Please wait a moment before checking out.' }, { status: 400 });
        }

        // Use engine
        const checkoutResult = computeCheckOut(new Date(existing.check_in), now, existing.is_late, config);

        existing.check_out = now;
        existing.status = checkoutResult.status;
        existing.work_hours = checkoutResult.work_hours;
        existing.is_overtime = checkoutResult.is_overtime;
        existing.overtime_hours = checkoutResult.overtime_hours;
        existing.is_early_departure = checkoutResult.is_early_departure;
        existing.early_departure_minutes = checkoutResult.early_departure_minutes;
        existing.is_valid_checkout = checkoutResult.is_valid_checkout;
        existing.early_exit_reason = checkoutResult.early_exit_reason;

        await existing.save();

        if (!checkoutResult.is_valid_checkout) {
          attendanceLog.earlyExit(user_id, company_id, checkoutResult.work_hours, config.min_checkout_hours);
        } else {
          attendanceLog.checkOut(user_id, company_id, checkoutResult.work_hours, checkoutResult.status, checkoutResult.is_valid_checkout);
        }

        const msg = checkoutMessage(user.name, checkoutResult, config.org_type);
          
        return NextResponse.json({
          success: true,
          data: {
            action: 'CHECK_OUT',
            message: msg,
            attendance: existing
          }
        });
      } else if (existing.check_out) {
        attendanceLog.alreadyCompleted(user_id, company_id);
        return NextResponse.json({ success: false, error: `Attendance already completed for today, ${user.name}.` }, { status: 400 });
      }
    }

    // --- CHECKIN FLOW ---
    const checkInResult = computeCheckIn(now, config);

    const attendance = new Attendance({
      user_id,
      company_id,
      date: today,
      check_in: now,
      status: checkInResult.status,
      mode,
      is_late: checkInResult.is_late,
      late_minutes: checkInResult.late_minutes,
      is_valid_checkout: true // Will be evaluated at checkout
    });

    await attendance.save();

    attendanceLog.checkIn(user_id, company_id, checkInResult.is_late, checkInResult.late_minutes);

    return NextResponse.json({
      success: true,
      data: {
        action: 'CHECK_IN',
        message: `Welcome, ${user.name}! ${checkInResult.is_late ? `Marked Late (${checkInResult.late_minutes} min)` : 'Marked Present'}`,
        attendance
      }
    }, { status: 201 });

  } catch (err: any) {
    appLog.error('MARK_ATTENDANCE_ERROR', { error: err.message, stack: err.stack });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
