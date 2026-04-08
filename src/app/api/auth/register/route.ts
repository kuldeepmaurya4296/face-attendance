import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import Company from '@/models/Company';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';
import { registerUserSchema, validateInput } from '@/lib/validators';
import { encryptEmbeddings } from '@/lib/services/encryption';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { securityLog, appLog } from '@/lib/services/logger';
import { MLService } from '@/lib/services/ml-service';
import { safeDecryptEmbeddings } from '@/lib/services/encryption';

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
      roll_number, class_name, section, enrollment_year, parent_phone,
      face_image // Optional: if provided, we can re-verify on server
    } = validation.data;

    const company_id = authResult.user.company_id;
    const company = await Company.findById(company_id);
    if (!company) return NextResponse.json({ success: false, error: 'Company not found' }, { status: 404 });

    const existingUser = await User.findOne({ email });
    if (existingUser) return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 400 });

    if (!face_embeddings || face_embeddings.length === 0) {
      return NextResponse.json({ success: false, error: 'Face ID is required for registration.' }, { status: 400 });
    }

    // --- ML INTEGRATION: Server-side Duplicate Check ---
    // This ensures "One Person, One Face" policy.
    if (face_image) {
      try {
        // 1. Fetch all users with face IDs
        const allUsers = await User.find({ 
          face_embeddings: { $exists: true, $type: "string", $ne: "" } 
        }).select('_id face_embeddings');
        
        console.log(`[AUTH_REGISTER] Total users with Face ID in system: ${allUsers.length}`);

        // 2. Decrypt gallery
        const gallery = allUsers.map(u => ({
          user_id: u._id.toString(),
          embeddings: safeDecryptEmbeddings(u.face_embeddings)
        })).filter(g => g.embeddings && g.embeddings.length > 0);

        console.log(`[AUTH_REGISTER] Gallery size after decryption: ${gallery.length}`);

        if (gallery.length > 0) {
          // 3. Convert base64 image to Blob
          const base64Data = face_image.includes(',') ? face_image.split(',')[1] : face_image;
          const imageBuffer = Buffer.from(base64Data, 'base64');
          const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });

          // 4. Check for duplicates via ML Engine
          const dupResult = await MLService.checkDuplicate(imageBlob, gallery);
          
          console.log(`[AUTH_REGISTER] Duplicate check result:`, dupResult);

          if (dupResult.duplicate) {
            securityLog.authFailure(`Duplicate face registration attempt. Matched user: ${dupResult.matched_user_id}`, ip);
            return NextResponse.json({ 
              success: false, 
              error: 'This face is already registered to another user. Each person can only have one account.' 
            }, { status: 400 });
          }
        }
      } catch (mlErr: any) {
        appLog.error('ML_DUPLICATE_CHECK_ERROR', { error: mlErr.message });
        // We continue if ML Service is down, but ideally it should be up.
        // In a production strict mode, you might want to block registration if check fails.
      }
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
