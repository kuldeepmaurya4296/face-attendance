import { NextRequest, NextResponse } from 'next/server';
import Holiday from '@/models/Holiday';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';
import { checkAdminPermission } from '@/lib/permissions';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (authResult.user.role === 'Admin') {
      const hasPerm = await checkAdminPermission(authResult.user, 'manage_holidays');
      if (!hasPerm) return NextResponse.json({ error: 'No permission' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const { date, name, type } = await req.json();

    const holiday = await Holiday.findByIdAndUpdate(
      id,
      { ...(date && { date: new Date(date) }), ...(name && { name }), ...(type && { type }) },
      { new: true }
    );
    return NextResponse.json({ message: 'Holiday updated', holiday });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (authResult.user.role === 'Admin') {
      const hasPerm = await checkAdminPermission(authResult.user, 'manage_holidays');
      if (!hasPerm) return NextResponse.json({ error: 'No permission' }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    await Holiday.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Holiday deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
