import { NextRequest, NextResponse } from 'next/server';
import Company from '@/models/Company';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();
    const { companyName, org_type, plan, adminName, adminEmail, adminPassword } = await req.json();

    if (!org_type || !['Company', 'Institute'].includes(org_type)) {
      return NextResponse.json({ error: 'org_type must be "Company" or "Institute"' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) return NextResponse.json({ error: 'Admin email already exists' }, { status: 400 });

    const company = new Company({
      name: companyName,
      org_type,
      plan: plan || 'Free'
    });
    await company.save();

    const superAdmin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'SuperAdmin',
      company_id: company._id
    });
    await superAdmin.save();

    return NextResponse.json({
      message: `${org_type} onboarded successfully!`,
      company,
      superAdmin
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
