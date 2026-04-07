import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import Company from '@/models/Company';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';
import { registerUserSchema, validateInput } from '@/lib/validators';
import { encryptEmbeddings } from '@/lib/services/encryption';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { securityLog, appLog } from '@/lib/services/logger';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`${ip}:auth_register`, RATE_LIMITS.API_GENERAL);
    if (!rateLimit.allowed) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }

    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['SuperAdmin', 'Admin'])) {
      securityLog.authFailure('Unauthorized register attempt', ip);
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = validateInput(registerUserSchema, body);
    if (!validation.success) {
      securityLog.invalidInput('/api/auth/register', validation.errors);
      return NextResponse.json({ success: false, error: validation.errors[0] }, { status: 400 });
    }

    await connectDB();
    const {
      name, email, password, role, face_embeddings,
      phone,
      employee_id, designation, department, joining_date,
      roll_number, class_name, section, enrollment_year, parent_phone
    } = validation.data;

    const company_id = authResult.user.company_id;
    const company = await Company.findById(company_id);
    if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });

    const existingUser = await User.findOne({ email });
    if (existingUser) return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 });

    if (!face_embeddings || face_embeddings.length === 0) {
      return NextResponse.json({ success: false, error: 'Face ID is required for registration.' }, { status: 400 });
    }

    // ENCRYPT EMBEDDINGS BEFORE SAVING
    const encryptedEmbeddings = encryptEmbeddings(face_embeddings);

    const userData: any = {
      name, email, password, role, company_id, 
      face_embeddings: encryptedEmbeddings as unknown as number[], // Schema expects number[] or any; we're breaking the strict TS typing in DB temporary until schema migration
      phone
    };
    
    // Note: We need to loosen the restriction on face_embeddings type in the User model to allow Strings
    // We'll update the User schema shortly to allow Mixed type or String type for embeddings.

    if (company.org_type === 'Company') {
      if (employee_id) userData.employee_id = employee_id;
      if (designation) userData.designation = designation;
      if (department) userData.department = department;
      if (joining_date) userData.joining_date = joining_date;
    } else if (company.org_type === 'Institute') {
      if (roll_number) userData.roll_number = roll_number;
      if (class_name) userData.class_name = class_name;
      if (section) userData.section = section;
      if (enrollment_year) userData.enrollment_year = enrollment_year;
      if (parent_phone) userData.parent_phone = parent_phone;
    }

    const user = new User(userData);
    await user.save();

    appLog.info('USER_REGISTERED', { email, company_id });

    // Clean response
    const resUser = user.toObject();
    delete resUser.password;
    delete resUser.face_embeddings;

    return NextResponse.json({ success: true, message: 'User registered successfully', data: resUser }, { status: 201 });
  } catch (err: any) {
    appLog.error('REGISTER_ERROR', { error: err.message });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
