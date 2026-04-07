import { NextRequest, NextResponse } from 'next/server';
import Company from '@/models/Company';
import User from '@/models/User';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();
    
    // Aggregation to find companies and their SuperAdmin
    const companiesWithAdmins = await Company.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'company_id',
          as: 'admins'
        }
      },
      {
        $addFields: {
          superAdmin: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$admins',
                  as: 'user',
                  cond: { $eq: ['$$user.role', 'SuperAdmin'] }
                }
              },
              0
            ]
          }
        }
      },
      {
        $project: {
          admins: 0,
          'superAdmin.face_embeddings': 0 // Remove embeddings for lightweight response
        }
      }
    ]);
    
    return NextResponse.json(companiesWithAdmins);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
