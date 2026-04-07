import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import Company from '@/models/Company';
import connectDB from '@/lib/db';
import { checkRateLimit, getClientIp, RATE_LIMITS } from '@/lib/middleware/rate-limit';
import { securityLog, appLog } from '@/lib/services/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`${ip}:login_face`, RATE_LIMITS.AUTH_LOGIN);
    if (!rateLimit.allowed) {
      securityLog.rateLimitHit(ip, '/api/auth/login-face');
      return NextResponse.json({ success: false, error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    await connectDB();
    const { user_id } = await req.json();

    if (!user_id) {
       return NextResponse.json({ success: false, error: 'user_id is required' }, { status: 400 });
    }

    const user = await User.findById(user_id);
    
    if (!user) {
      securityLog.authFailure('Face login user not found', ip);
      return NextResponse.json({ success: false, error: 'User mapping failed' }, { status: 401 });
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

    appLog.info('FACE_LOGIN_SUCCESS', { user_id });

    return NextResponse.json({ 
      success: true, 
      message: 'Face ID login successful', 
      token, 
      user: { ...userObj, org_type, admin_permissions, branding } 
    });
  } catch (err: any) {
    appLog.error('FACE_LOGIN_ERROR', { error: err.message });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
