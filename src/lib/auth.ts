import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/models/User';
import connectDB from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_123';

export async function auth(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided', status: 401 };
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string; company_id: string; org_type?: string };

    await connectDB();
    const userDoc = await User.findById(decoded.id).select('-password');

    if (!userDoc) {
      return { error: 'User not found', status: 401 };
    }

    const user = { ...userDoc.toObject(), org_type: decoded.org_type };

    return { user, status: 200 };
  } catch (err) {
    return { error: 'Invalid token', status: 401 };
  }
}

export function authorize(user: any, allowedRoles: string[]) {
  return allowedRoles.includes(user.role);
}
