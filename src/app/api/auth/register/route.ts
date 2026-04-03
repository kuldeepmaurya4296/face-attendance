import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const {
      name, email, password, role, company_id, face_embeddings,
      phone,
      // Employee fields
      employee_id, designation, department, joining_date,
      // Student fields
      roll_number, class_name, section, enrollment_year, parent_phone
    } = await req.json();

    // Only 4 valid roles
    if (role && !['Owner', 'SuperAdmin', 'Admin', 'User'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) return NextResponse.json({ error: 'Email already exists' }, { status: 400 });

    if (['User', 'Admin'].includes(role) && (!face_embeddings || face_embeddings.length === 0)) {
      return NextResponse.json({ error: 'Face ID is required for registration.' }, { status: 400 });
    }

    const userData: any = {
      name, email, password, role, company_id, face_embeddings, phone,
      // Employee fields
      employee_id, designation, department, joining_date,
      // Student fields
      roll_number, class_name, section, enrollment_year, parent_phone
    };

    // Remove undefined fields
    Object.keys(userData).forEach(key => {
      if (userData[key] === undefined || userData[key] === '') delete userData[key];
    });

    const user = new User(userData);
    await user.save();

    return NextResponse.json({ message: 'User registered successfully', user }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
