import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Holiday from '@/models/Holiday';
import Leave from '@/models/Leave';
import Company from '@/models/Company';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner', 'SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'monthly';
    const fromStr = url.searchParams.get('from');
    const toStr = url.searchParams.get('to');

    const companyId = authResult.user.company_id;
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

    const company = await Company.findById(companyId).lean() as any;
    const weekendDays = company?.settings?.weekend_days || [0, 6];

    // Date range
    const now = new Date();
    let from: Date, to: Date;
    if (fromStr && toStr) {
      from = new Date(fromStr);
      to = new Date(toStr);
    } else {
      switch (type) {
        case 'weekly':
          from = new Date(now); from.setDate(now.getDate() - now.getDay()); to = new Date(now); break;
        case 'yearly':
          from = new Date(now.getFullYear(), 0, 1); to = new Date(now); break;
        default:
          from = new Date(now.getFullYear(), now.getMonth(), 1); to = new Date(now); break;
      }
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);

    // Working days
    const holidays = await Holiday.find({ company_id: companyId, date: { $gte: from, $lte: to } }).lean();
    const holidayDates = new Set(holidays.map(h => { const d = new Date(h.date as any); d.setHours(0,0,0,0); return d.getTime(); }));
    const today = new Date(); today.setHours(0,0,0,0);
    let totalWorkingDays = 0;
    for (let d = new Date(from); d <= to && d <= today; d.setDate(d.getDate() + 1)) {
      if (!weekendDays.includes(d.getDay()) && !holidayDates.has(d.getTime())) totalWorkingDays++;
    }

    // Users & records
    const users = await User.find({ company_id: companyId, role: { $in: ['Admin','User'] }, status: 'Active' })
      .select('name email department designation employee_id').lean();
    const records = await Attendance.find({ company_id: companyId, date: { $gte: from, $lte: to } }).lean();
    const leaves = await Leave.find({ company_id: companyId, status: 'Approved', from_date: { $lte: to }, to_date: { $gte: from } }).lean();

    // Build workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = company?.name || 'Aura Vision';
    workbook.created = new Date();

    // ===== SHEET 1: Summary =====
    const summarySheet = workbook.addWorksheet('Attendance Summary');
    
    // Header
    summarySheet.mergeCells('A1:I1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `${company?.name || 'Organization'} — Attendance Report`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF2563EB' } };
    titleCell.alignment = { horizontal: 'center' };

    summarySheet.mergeCells('A2:I2');
    const periodCell = summarySheet.getCell('A2');
    periodCell.value = `Period: ${from.toLocaleDateString()} to ${to.toLocaleDateString()} | Working Days: ${totalWorkingDays}`;
    periodCell.font = { size: 11, color: { argb: 'FF737373' } };
    periodCell.alignment = { horizontal: 'center' };

    summarySheet.addRow([]); // spacer

    // Column headers
    const headerRow = summarySheet.addRow([
      'Employee', 'Email', 'Department', 'Present', 'Absent', 'Late', 'Half-Day',
      'On Leave', 'Attendance %', 'Avg Hours', 'Total Hours', 'Overtime Hrs'
    ]);
    headerRow.font = { bold: true, size: 11 };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } } };
    });

    // Column widths
    summarySheet.columns = [
      { width: 22 }, { width: 28 }, { width: 16 }, { width: 10 }, { width: 10 },
      { width: 8 }, { width: 10 }, { width: 10 }, { width: 14 }, { width: 12 },
      { width: 12 }, { width: 14 }
    ];

    // Data rows
    for (const user of users) {
      const userRecords = records.filter(r => (r as any).user_id?.toString() === (user as any)._id.toString());
      const userLeaves = leaves.filter(l => (l as any).user_id?.toString() === (user as any)._id.toString());

      const present = userRecords.filter(r => (r as any).status === 'Present').length;
      const late = userRecords.filter(r => (r as any).is_late).length;
      const halfDay = userRecords.filter(r => (r as any).status === 'Half-Day').length;

      let leaveDays = 0;
      for (const leave of userLeaves) {
        const lFrom = new Date(Math.max(new Date(leave.from_date as any).getTime(), from.getTime()));
        const lTo = new Date(Math.min(new Date(leave.to_date as any).getTime(), to.getTime()));
        for (let d = new Date(lFrom); d <= lTo; d.setDate(d.getDate() + 1)) {
          if (!weekendDays.includes(d.getDay()) && !holidayDates.has(d.getTime())) leaveDays++;
        }
      }

      const totalHours = userRecords.reduce((s, r) => s + ((r as any).work_hours || 0), 0);
      const overtimeHours = userRecords.reduce((s, r) => s + ((r as any).overtime_hours || 0), 0);
      const daysWorked = userRecords.filter(r => (r as any).check_in).length;
      const absent = Math.max(0, totalWorkingDays - present - late - halfDay - leaveDays);
      const attendancePct = totalWorkingDays > 0 
        ? parseFloat((((present + late + halfDay * 0.5) / totalWorkingDays) * 100).toFixed(1)) 
        : 0;

      const row = summarySheet.addRow([
        (user as any).name, (user as any).email, (user as any).department || 'General',
        present + late, absent, late, halfDay, leaveDays,
        attendancePct, 
        daysWorked > 0 ? parseFloat((totalHours / daysWorked).toFixed(1)) : 0,
        parseFloat(totalHours.toFixed(1)),
        parseFloat(overtimeHours.toFixed(1))
      ]);

      // Color code attendance %
      const pctCell = row.getCell(9);
      if (attendancePct >= 90) {
        pctCell.font = { color: { argb: 'FF16A34A' }, bold: true };
      } else if (attendancePct >= 75) {
        pctCell.font = { color: { argb: 'FFD97706' }, bold: true };
      } else {
        pctCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
    }

    // ===== SHEET 2: Day-by-Day Detail =====
    const detailSheet = workbook.addWorksheet('Day-by-Day Detail');
    const detailHeader = detailSheet.addRow(['Employee', 'Date', 'Check In', 'Check Out', 'Hours', 'Status', 'Mode', 'Late (min)', 'Notes']);
    detailHeader.font = { bold: true, size: 11 };
    detailHeader.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
    });
    detailSheet.columns = [
      { width: 22 }, { width: 14 }, { width: 12 }, { width: 12 }, { width: 8 },
      { width: 14 }, { width: 10 }, { width: 12 }, { width: 30 }
    ];

    const sortedRecords = [...records].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const rec of sortedRecords) {
      const r = rec as any;
      const user = users.find(u => (u as any)._id.toString() === r.user_id?.toString());
      detailSheet.addRow([
        (user as any)?.name || 'Unknown',
        new Date(r.date).toLocaleDateString(),
        r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        r.work_hours || 0,
        r.status,
        r.mode,
        r.late_minutes || 0,
        r.notes || ''
      ]);
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const filename = `Attendance_Report_${from.toISOString().split('T')[0]}_to_${to.toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
