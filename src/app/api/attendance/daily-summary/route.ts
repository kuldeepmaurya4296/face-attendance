import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Leave from '@/models/Leave';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';
import { checkAdminPermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check admin permission
    if (authResult.user.role === 'Admin') {
      const hasPermission = await checkAdminPermission(authResult.user, 'view_attendance');
      if (!hasPermission) {
        return NextResponse.json({ error: 'You do not have permission to view attendance' }, { status: 403 });
      }
    }

    await connectDB();

    const url = new URL(req.url);
    const dateStr = url.searchParams.get('date');
    const date = dateStr ? new Date(dateStr) : new Date();
    date.setHours(0, 0, 0, 0);

    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const companyId = authResult.user.company_id;
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    // Get all active users in the company (exclude SuperAdmin for counting)
    const allUsers = await User.find({
      company_id: companyId,
      role: { $in: ['Admin', 'User'] },
      status: 'Active'
    }).select('name email department designation class_name section role');

    // Get today's attendance records
    const records = await Attendance.find({
      company_id: companyId,
      date: { $gte: date, $lte: dateEnd }
    }).populate('user_id', 'name email department designation class_name section role');

    // Get users on approved leave today
    const onLeave = await Leave.find({
      company_id: companyId,
      status: 'Approved',
      from_date: { $lte: dateEnd },
      to_date: { $gte: date }
    }).populate('user_id', 'name email');

    const checkedInIds = new Set(records.map(r => r.user_id?._id?.toString()));
    const onLeaveIds = new Set(onLeave.map(l => l.user_id?._id?.toString()));

    const present = records.filter(r => r.status === 'Present').length;
    const late = records.filter(r => r.is_late).length;
    const halfDay = records.filter(r => r.status === 'Half-Day').length;
    const earlyDep = records.filter(r => r.status === 'Early-Departure').length;

    const notCheckedIn = allUsers.filter(u =>
      !checkedInIds.has(u._id.toString()) && !onLeaveIds.has(u._id.toString())
    );

    const lateArrivals = records
      .filter(r => r.is_late)
      .map(r => ({
        name: r.user_id?.name,
        email: r.user_id?.email,
        late_by: r.late_minutes,
        check_in: r.check_in
      }));

    return NextResponse.json({
      total_users: allUsers.length,
      present,
      late,
      half_day: halfDay,
      early_departure: earlyDep,
      on_leave: onLeave.length,
      absent: notCheckedIn.length,
      not_checked_in: notCheckedIn.map(u => ({ name: u.name, email: u.email, department: u.department, role: u.role })),
      late_arrivals: lateArrivals,
      checked_out: records.filter(r => r.check_out).map(r => ({
        name: r.user_id?.name,
        work_hours: r.work_hours
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
