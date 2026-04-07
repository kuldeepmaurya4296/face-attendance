import { NextRequest, NextResponse } from 'next/server';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import Leave from '@/models/Leave';
import connectDB from '@/lib/db';
import { auth, authorize } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner', 'SuperAdmin', 'Admin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { 
      name, email, role, password, phone,
      employee_id, designation, department, joining_date,
      roll_number, class_name, section, enrollment_year, parent_phone
    } = body;

    const targetUser = await User.findById(id);
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    // Safety check: Only Owner can modify a SuperAdmin
    if (targetUser.role === 'SuperAdmin' && authResult.user.role !== 'Owner') {
      return NextResponse.json({ error: 'Cannot modify a SuperAdmin account.' }, { status: 403 });
    }

    // Email duplication check
    if (email && email !== targetUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) return NextResponse.json({ error: 'Email already in use by another user.' }, { status: 400 });
    }

    const updateFields: any = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (password) updateFields.password = password; // Note: In production hashing is handled by pre-save or here
    if (phone !== undefined) updateFields.phone = phone;
    
    // Auth role protection
    if (role && authResult.user.role === 'Owner') updateFields.role = role; 
    else if (role && authResult.user.role === 'SuperAdmin' && role !== 'SuperAdmin') updateFields.role = role;

    // Company/Institute Fields
    if (employee_id !== undefined) updateFields.employee_id = employee_id;
    if (designation !== undefined) updateFields.designation = designation;
    if (department !== undefined) updateFields.department = department;
    if (joining_date !== undefined) updateFields.joining_date = joining_date;
    
    if (roll_number !== undefined) updateFields.roll_number = roll_number;
    if (class_name !== undefined) updateFields.class_name = class_name;
    if (section !== undefined) updateFields.section = section;
    if (enrollment_year !== undefined) updateFields.enrollment_year = enrollment_year;
    if (parent_phone !== undefined) updateFields.parent_phone = parent_phone;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -face_embeddings');

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await auth(req);
    if (authResult.error) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    if (!authorize(authResult.user, ['Owner', 'SuperAdmin'])) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const targetUser = await User.findById(id);
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (targetUser.role === 'SuperAdmin' && authResult.user.role !== 'Owner') {
      return NextResponse.json({ error: 'Cannot delete a SuperAdmin account.' }, { status: 403 });
    }

    if (authResult.user._id.toString() === id) {
      return NextResponse.json({ error: 'Cannot delete your own account.' }, { status: 400 });
    }

    const delAttendance = await Attendance.deleteMany({ user_id: id });
    const delLeaves = await Leave.deleteMany({ user_id: id });

    await User.findByIdAndDelete(id);
    return NextResponse.json({ 
      message: 'User deleted successfully', 
      deleted: { attendance: delAttendance.deletedCount, leaves: delLeaves.deletedCount } 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
