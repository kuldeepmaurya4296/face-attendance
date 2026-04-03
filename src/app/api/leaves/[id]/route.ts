import { NextRequest, NextResponse } from 'next/server';
import Leave from '@/models/Leave';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';
import { checkAdminPermission } from '@/lib/permissions';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner', 'SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check admin permission for leave approval
    if (authResult.user.role === 'Admin') {
      const hasPermission = await checkAdminPermission(authResult.user, 'approve_leaves');
      if (!hasPermission) {
        return NextResponse.json({ error: 'You do not have permission to approve leaves' }, { status: 403 });
      }
    }

    await connectDB();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { status } = await req.json();

    const leave = await Leave.findByIdAndUpdate(
      id,
      { status, approved_by: authResult.user._id },
      { new: true }
    );
    return NextResponse.json({ message: `Leave ${status}`, leave });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
