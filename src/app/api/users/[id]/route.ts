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
    const { name, email, role, department, password } = await req.json();

    const targetUser = await User.findById(id);
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    if (targetUser.role === 'SuperAdmin' && authResult.user.role !== 'Owner') {
      return NextResponse.json({ error: 'Cannot modify a SuperAdmin account.' }, { status: 403 });
    }

    if (email && email !== targetUser.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) return NextResponse.json({ error: 'Email already in use by another user.' }, { status: 400 });
    }

    const updateFields: any = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (password) updateFields.password = password;
    if (department !== undefined) updateFields.department = department;
    if (role && authResult.user.role === 'Owner') updateFields.role = role; 
    if (role && authResult.user.role === 'SuperAdmin' && role !== 'SuperAdmin') updateFields.role = role;

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
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
