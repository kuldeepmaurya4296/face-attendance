import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import Company from '@/models/Company';
import connectDB from '@/lib/db';

import { loginSchema, validateInput } from '@/lib/validators';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    // Validate and normalize input (lowercase/trim email)
    const validation = validateInput(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.errors[0] }, { status: 400 });
    }

    const { email, password } = validation.data;
    const user = await User.findOne({ email });

    console.log('--- LOGIN DEBUG ---');
    console.log('Query Email:', email);
    console.log('User Found:', !!user);
    if (user) {
      console.log('Match result:', user.password === password);
      // NOTE: Be careful with password logging in production; only for temporary debugging if needed
      // console.log('Stored Pass:', user.password);
      // console.log('Input Pass:', password);
    }
    console.log('-------------------');

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Fetch company to get org_type, admin_permissions, and branding
    let org_type = null;
    let admin_permissions = null;
    let branding = null;
    if (user.company_id) {
      const company = await Company.findById(user.company_id);
      org_type = company?.org_type || null;
      branding = company?.settings?.branding || null;
      if (user.role === 'Admin') {
        admin_permissions = company?.admin_permissions || null;
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, company_id: user.company_id, org_type },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.face_embeddings;

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: { ...userObj, org_type, admin_permissions, branding }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
