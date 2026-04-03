import { NextRequest, NextResponse } from 'next/server';
import Holiday from '@/models/Holiday';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';
import { checkAdminPermission } from '@/lib/permissions';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectDB();
    const companyId = authResult.user.company_id;
    if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

    const url = new URL(req.url);
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const holidays = await Holiday.find({
      company_id: companyId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    return NextResponse.json(holidays);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (authResult.user.role === 'Admin') {
      const hasPerm = await checkAdminPermission(authResult.user, 'manage_holidays');
      if (!hasPerm) return NextResponse.json({ error: 'No permission to manage holidays' }, { status: 403 });
    }

    await connectDB();
    const { date, name, type } = await req.json();

    const holiday = new Holiday({
      company_id: authResult.user.company_id,
      date: new Date(date),
      name,
      type: type || 'Public'
    });
    await holiday.save();

    return NextResponse.json({ message: 'Holiday created', holiday }, { status: 201 });
  } catch (err: any) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'A holiday already exists on this date' }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
