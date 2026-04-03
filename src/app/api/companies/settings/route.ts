import { NextRequest, NextResponse } from 'next/server';
import Company from '@/models/Company';
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

    await connectDB();
    const company = await Company.findById(authResult.user.company_id);
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    return NextResponse.json({
      settings: company.settings,
      admin_permissions: company.admin_permissions,
      org_type: company.org_type,
      name: company.name,
      plan: company.plan
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Admin needs manage_settings permission
    if (authResult.user.role === 'Admin') {
      const hasPerm = await checkAdminPermission(authResult.user, 'manage_settings');
      if (!hasPerm) return NextResponse.json({ error: 'No permission to manage settings' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const company = await Company.findById(authResult.user.company_id);
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    // Update settings
    if (body.settings) {
      company.settings = { ...company.settings?.toObject?.() || company.settings, ...body.settings };
    }

    // Only SuperAdmin can update admin_permissions
    if (body.admin_permissions && authResult.user.role === 'SuperAdmin') {
      company.admin_permissions = { ...company.admin_permissions?.toObject?.() || company.admin_permissions, ...body.admin_permissions };
    }

    await company.save();

    return NextResponse.json({
      message: 'Settings updated',
      settings: company.settings,
      admin_permissions: company.admin_permissions
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
