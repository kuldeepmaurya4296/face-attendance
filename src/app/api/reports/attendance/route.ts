import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Holiday from '@/models/Holiday';
import Leave from '@/models/Leave';
import Company from '@/models/Company';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';
import { checkAdminPermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner', 'SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (authResult.user.role === 'Admin') {
      const hasPermission = await checkAdminPermission(authResult.user, 'view_attendance');
      if (!hasPermission) {
        return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
      }
    }

    await connectDB();

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'monthly'; // daily, weekly, monthly, yearly
    const fromStr = url.searchParams.get('from');
    const toStr = url.searchParams.get('to');
    const department = url.searchParams.get('department');
    const userId = url.searchParams.get('userId');

    const companyId = authResult.user.company_id;
    if (!companyId) {
      return NextResponse.json({ error: 'No company associated' }, { status: 400 });
    }

    const company = await Company.findById(companyId);
    const weekendDays = company?.settings?.weekend_days || [0, 6];

    // Calculate date range
    const now = new Date();
    let from: Date, to: Date;

    if (fromStr && toStr) {
      from = new Date(fromStr);
      to = new Date(toStr);
    } else {
      switch (type) {
        case 'weekly':
          from = new Date(now);
          from.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
          to = new Date(now);
          break;
        case 'yearly':
          from = new Date(now.getFullYear(), 0, 1);
          to = new Date(now);
          break;
        case 'monthly':
        default:
          from = new Date(now.getFullYear(), now.getMonth(), 1);
          to = new Date(now);
          break;
      }
    }

    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    // Calculate total working days in range
    let totalWorkingDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const holidays = await Holiday.find({
      company_id: companyId,
      date: { $gte: from, $lte: to },
    });
    const holidayDates = new Set(holidays.map(h => {
      const d = new Date(h.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }));

    for (let d = new Date(from); d <= to && d <= today; d.setDate(d.getDate() + 1)) {
      if (!weekendDays.includes(d.getDay()) && !holidayDates.has(d.getTime())) {
        totalWorkingDays++;
      }
    }

    // Get users
    const userFilter: any = {
      company_id: companyId,
      role: { $in: ['Admin', 'User'] },
      status: 'Active',
    };
    if (department) userFilter.department = department;
    if (userId) userFilter._id = userId;

    const users = await User.find(userFilter).select('name email department designation role').lean();

    // Get attendance records
    const records = await Attendance.find({
      company_id: companyId,
      date: { $gte: from, $lte: to },
      ...(userId ? { user_id: userId } : {}),
    }).lean();

    // Get leaves
    const leaves = await Leave.find({
      company_id: companyId,
      status: 'Approved',
      from_date: { $lte: to },
      to_date: { $gte: from },
    }).lean();

    // Build per-user report rows
    const rows = users.map(user => {
      const userRecords = records.filter(r => r.user_id?.toString() === user._id.toString());
      const userLeaves = leaves.filter(l => l.user_id?.toString() === user._id.toString());

      const present = userRecords.filter(r => r.status === 'Present').length;
      const late = userRecords.filter(r => r.is_late).length;
      const halfDay = userRecords.filter(r => r.status === 'Half-Day').length;
      const earlyDep = userRecords.filter(r => r.status === 'Early-Departure').length;
      
      // Count leave days within the range
      let leaveDays = 0;
      for (const leave of userLeaves) {
        const lFrom = new Date(Math.max(new Date(leave.from_date).getTime(), from.getTime()));
        const lTo = new Date(Math.min(new Date(leave.to_date).getTime(), to.getTime()));
        for (let d = new Date(lFrom); d <= lTo; d.setDate(d.getDate() + 1)) {
          if (!weekendDays.includes(d.getDay()) && !holidayDates.has(d.getTime())) {
            leaveDays++;
          }
        }
      }

      const totalWorkHours = userRecords.reduce((sum, r) => sum + (r.work_hours || 0), 0);
      const overtimeHours = userRecords.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
      const daysWorked = userRecords.filter(r => r.check_in).length;
      const absent = Math.max(0, totalWorkingDays - present - late - halfDay - leaveDays);

      return {
        user_id: user._id.toString(),
        name: user.name,
        email: user.email,
        department: user.department || 'General',
        total_working_days: totalWorkingDays,
        present: present + late, // Late is still present
        absent,
        late,
        half_day: halfDay,
        early_departure: earlyDep,
        on_leave: leaveDays,
        overtime_hours: parseFloat(overtimeHours.toFixed(1)),
        avg_work_hours: daysWorked > 0 ? parseFloat((totalWorkHours / daysWorked).toFixed(1)) : 0,
        total_work_hours: parseFloat(totalWorkHours.toFixed(1)),
        attendance_percentage: totalWorkingDays > 0
          ? parseFloat(((((present + late + halfDay * 0.5) / totalWorkingDays) * 100)).toFixed(1))
          : 0,
      };
    });

    // Department breakdown
    const deptMap = new Map<string, typeof rows>();
    rows.forEach(row => {
      const dept = row.department;
      if (!deptMap.has(dept)) deptMap.set(dept, []);
      deptMap.get(dept)!.push(row);
    });

    const department_breakdown = Array.from(deptMap.entries()).map(([dept, deptRows]) => ({
      department: dept,
      total: deptRows.length,
      avg_attendance_pct: parseFloat((deptRows.reduce((s, r) => s + r.attendance_percentage, 0) / deptRows.length).toFixed(1)),
      avg_work_hours: parseFloat((deptRows.reduce((s, r) => s + r.avg_work_hours, 0) / deptRows.length).toFixed(1)),
    }));

    // Most late employees
    const most_late = rows
      .filter(r => r.late > 0)
      .sort((a, b) => b.late - a.late)
      .slice(0, 5)
      .map(r => ({ name: r.name, count: r.late }));

    const avgPct = rows.length > 0
      ? parseFloat((rows.reduce((s, r) => s + r.attendance_percentage, 0) / rows.length).toFixed(1))
      : 0;

    return NextResponse.json({
      period: `${from.toISOString().split('T')[0]} to ${to.toISOString().split('T')[0]}`,
      period_type: type,
      from: from.toISOString(),
      to: to.toISOString(),
      total_working_days: totalWorkingDays,
      total_employees: rows.length,
      avg_attendance_pct: avgPct,
      total_overtime_hours: parseFloat(rows.reduce((s, r) => s + r.overtime_hours, 0).toFixed(1)),
      most_late,
      department_breakdown,
      rows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
