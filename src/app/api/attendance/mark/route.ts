import { NextRequest, NextResponse } from 'next/server';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Company from '@/models/Company';
import connectDB from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { user_id, company_id, mode } = await req.json();
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const existing = await Attendance.findOne({ user_id, date: today });
    
    if (existing) {
      if (!existing.check_out) {
        existing.check_out = new Date();
        await existing.save();
        const user = await User.findById(user_id).select('name');
        return NextResponse.json({ message: `Goodbye, ${user.name}! Checked out successfully`, attendance: existing });
      } else {
        return NextResponse.json({ error: 'Attendance already marked for today' }, { status: 400 });
      }
    }

    const company = await Company.findById(company_id);
    const now = new Date();
    
    const officeStart = company?.settings?.office_timing || '09:00';
    const lateThreshold = company?.settings?.late_threshold_minutes || 15;
    
    const [hours, minutes] = officeStart.split(':').map(Number);
    const thresholdTime = new Date();
    thresholdTime.setHours(hours, minutes + lateThreshold, 0, 0); 
    
    const status = now > thresholdTime ? 'Late' : 'Present';

    const attendance = new Attendance({
      user_id,
      company_id,
      date: today,
      check_in: now,
      status,
      mode
    });

    await attendance.save();
    
    const user = await User.findById(user_id).select('name');
    return NextResponse.json({ message: `Welcome, ${user.name}! Marked ${status}`, attendance }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
