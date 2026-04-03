import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Company from '@/models/Company';
import Holiday from '@/models/Holiday';
import Leave from '@/models/Leave';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { user_id, company_id, mode } = await req.json();

    if (!user_id || !company_id || !mode) {
      return NextResponse.json({ error: 'user_id, company_id, and mode are required' }, { status: 400 });
    }

    const company = await Company.findById(company_id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const settings = company.settings || {};
    const shiftStart = settings.shift_start || '09:00';
    const shiftEnd = settings.shift_end || '18:00';
    const lateThreshold = settings.late_threshold_minutes || 15;
    const earlyDepThreshold = settings.early_departure_threshold_minutes || 15;
    const fullDayHours = settings.full_day_hours || 8;
    const halfDayHours = settings.half_day_hours || 4;
    const overtimeThreshold = settings.overtime_threshold_hours || 9;
    const weekendDays = settings.weekend_days || [0, 6];

    // Check if weekend
    const dayOfWeek = now.getDay();
    if (weekendDays.includes(dayOfWeek)) {
      return NextResponse.json({ error: 'Today is a weekend. Attendance cannot be marked.' }, { status: 400 });
    }

    // Check if holiday
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    const holiday = await Holiday.findOne({
      company_id,
      date: { $gte: today, $lte: todayEnd }
    });
    if (holiday) {
      return NextResponse.json({ error: `Today is a holiday: ${holiday.name}` }, { status: 400 });
    }

    // Check if on approved leave
    const approvedLeave = await Leave.findOne({
      user_id,
      status: 'Approved',
      from_date: { $lte: todayEnd },
      to_date: { $gte: today }
    });
    if (approvedLeave) {
      return NextResponse.json({ error: 'You are on approved leave today.' }, { status: 400 });
    }

    const user = await User.findById(user_id).select('name');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find existing attendance record for today
    const existing = await Attendance.findOne({ user_id, date: today });

    if (existing) {
      // CHECKOUT FLOW
      if (existing.check_in && !existing.check_out) {
        existing.check_out = now;

        // Calculate work hours
        const workMs = now.getTime() - new Date(existing.check_in).getTime();
        const workHours = parseFloat((workMs / 3600000).toFixed(2));
        existing.work_hours = workHours;

        // Determine final status based on work hours
        if (workHours >= fullDayHours) {
          existing.status = existing.is_late ? 'Late' : 'Present';
        } else if (workHours >= halfDayHours) {
          existing.status = 'Half-Day';
        } else {
          existing.status = 'Early-Departure';
        }

        // Detect early departure
        const [endH, endM] = shiftEnd.split(':').map(Number);
        const shiftEndTime = new Date();
        shiftEndTime.setHours(endH, endM - earlyDepThreshold, 0, 0);
        if (now < shiftEndTime) {
          existing.is_early_departure = true;
          const earlyMs = shiftEndTime.getTime() - now.getTime();
          existing.early_departure_minutes = Math.round(earlyMs / 60000);
        }

        // Detect overtime
        if (workHours > overtimeThreshold) {
          existing.is_overtime = true;
          existing.overtime_hours = parseFloat((workHours - overtimeThreshold).toFixed(2));
        }

        await existing.save();
        return NextResponse.json({
          action: 'CHECK_OUT',
          message: `Goodbye, ${user.name}! Worked ${workHours.toFixed(1)}h today`,
          attendance: existing
        });
      } else if (existing.check_out) {
        return NextResponse.json({ error: `Attendance already completed for today, ${user.name}.` }, { status: 400 });
      }
    }

    // CHECKIN FLOW
    const [startH, startM] = shiftStart.split(':').map(Number);
    const thresholdTime = new Date();
    thresholdTime.setHours(startH, startM + lateThreshold, 0, 0);

    const isLate = now > thresholdTime;
    let lateMinutes = 0;
    if (isLate) {
      const lateStart = new Date();
      lateStart.setHours(startH, startM, 0, 0);
      lateMinutes = Math.round((now.getTime() - lateStart.getTime()) / 60000);
    }

    const attendance = new Attendance({
      user_id,
      company_id,
      date: today,
      check_in: now,
      status: isLate ? 'Late' : 'Present',
      mode,
      is_late: isLate,
      late_minutes: lateMinutes
    });

    await attendance.save();
    return NextResponse.json({
      action: 'CHECK_IN',
      message: `Welcome, ${user.name}! ${isLate ? `Marked Late (${lateMinutes} min)` : 'Marked Present'}`,
      attendance
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
