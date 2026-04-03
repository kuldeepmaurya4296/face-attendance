import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import Holiday from '@/models/Holiday';
import Leave from '@/models/Leave';
import Company from '@/models/Company';
import connectDB from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();

    const url = new URL(req.url);
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    const userId = authResult.user._id;
    const companyId = authResult.user.company_id;

    // Get company settings for weekend days
    const company = await Company.findById(companyId);
    const weekendDays = company?.settings?.weekend_days || [0, 6];

    // Date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch attendance records
    const records = await Attendance.find({
      user_id: userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Fetch holidays
    const holidays = await Holiday.find({
      company_id: companyId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Fetch approved leaves
    const leaves = await Leave.find({
      user_id: userId,
      status: 'Approved',
      from_date: { $lte: endDate },
      to_date: { $gte: startDate }
    });

    // Build day-by-day calendar
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendarData: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isPast = date < today;
      const isToday = date.getTime() === today.getTime();

      // Check if weekend
      if (weekendDays.includes(dayOfWeek)) {
        calendarData.push({ date: dateStr, status: 'Weekend', is_today: isToday });
        continue;
      }

      // Check if holiday
      const holiday = holidays.find(h => {
        const hDate = new Date(h.date);
        hDate.setHours(0, 0, 0, 0);
        return hDate.getTime() === date.getTime();
      });
      if (holiday) {
        calendarData.push({ date: dateStr, status: 'Holiday', holiday_name: holiday.name, is_today: isToday });
        continue;
      }

      // Check if on leave
      const onLeave = leaves.find(l => {
        const from = new Date(l.from_date);
        from.setHours(0, 0, 0, 0);
        const to = new Date(l.to_date);
        to.setHours(23, 59, 59, 999);
        return date >= from && date <= to;
      });
      if (onLeave) {
        calendarData.push({ date: dateStr, status: 'On-Leave', is_today: isToday });
        continue;
      }

      // Check attendance record
      const record = records.find(r => {
        const rDate = new Date(r.date);
        rDate.setHours(0, 0, 0, 0);
        return rDate.getTime() === date.getTime();
      });

      if (record) {
        calendarData.push({
          date: dateStr,
          status: record.status,
          check_in: record.check_in,
          check_out: record.check_out,
          work_hours: record.work_hours,
          is_late: record.is_late,
          late_minutes: record.late_minutes,
          is_overtime: record.is_overtime,
          mode: record.mode,
          is_today: isToday
        });
      } else if (isPast) {
        calendarData.push({ date: dateStr, status: 'Absent', is_today: isToday });
      } else {
        calendarData.push({ date: dateStr, status: null, is_today: isToday });
      }
    }

    return NextResponse.json(calendarData);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
