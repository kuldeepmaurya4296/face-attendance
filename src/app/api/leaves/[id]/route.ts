import { NextRequest, NextResponse } from 'next/server';
import Leave from '@/models/Leave';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner', 'SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { status } = await req.json(); // 'Approved' or 'Rejected'

    const leave = await Leave.findByIdAndUpdate(id, { status }, { new: true });
    return NextResponse.json({ message: `Leave ${status}`, leave });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
