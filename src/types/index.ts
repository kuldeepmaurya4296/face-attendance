// ============================================================
// Aura Vision — Centralized Type Definitions
// ============================================================

// ---- Roles & Permissions ----
export type Role = 'Owner' | 'SuperAdmin' | 'Admin' | 'User';
export type OrgType = 'Company' | 'Institute';

export interface AdminPermissions {
  manage_personnel: boolean;
  approve_leaves: boolean;
  view_attendance: boolean;
  manage_settings: boolean;
  manage_holidays: boolean;
}

// ---- User ----
export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  company_id?: string;
  org_type?: OrgType;
  phone?: string;
  status: 'Active' | 'Inactive';
  // Company fields
  employee_id?: string;
  designation?: string;
  department?: string;
  joining_date?: string;
  // Institute fields
  roll_number?: string;
  class_name?: string;
  section?: string;
  enrollment_year?: number;
  parent_phone?: string;
  // Computed
  has_face_id?: boolean;
  admin_permissions?: AdminPermissions;
  createdAt?: string;
}

// ---- Company ----
export interface CompanySettings {
  attendance_mode: 'SELF' | 'KIOSK' | 'BOTH';
  allow_self_checkin: boolean;
  shift_start: string;
  shift_end: string;
  late_threshold_minutes: number;
  early_departure_threshold_minutes: number;
  full_day_hours: number;
  half_day_hours: number;
  overtime_threshold_hours: number;
  weekend_days: number[];
  auto_checkout_time: string;
  theme: string;
}

export interface LeavePolicy {
  casual: number;
  sick: number;
  earned: number;
  unpaid: number; // -1 = unlimited
}

export interface ICompany {
  _id: string;
  name: string;
  org_type: OrgType;
  plan: 'Free' | 'Paid';
  status: 'Active' | 'Inactive';
  settings: CompanySettings;
  admin_permissions: AdminPermissions;
  leave_policy?: LeavePolicy;
  createdAt?: string;
}

// ---- Attendance ----
export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half-Day' | 'On-Leave' | 'Holiday' | 'Weekend' | 'Early-Departure';
export type AttendanceMode = 'SELF' | 'KIOSK' | 'MANUAL';

export interface IAttendance {
  _id: string;
  user_id: IUser | string;
  company_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: AttendanceStatus;
  mode: AttendanceMode;
  work_hours: number;
  is_overtime: boolean;
  overtime_hours: number;
  is_late: boolean;
  late_minutes: number;
  is_early_departure: boolean;
  early_departure_minutes: number;
  notes?: string;
  createdAt?: string;
}

// ---- Leave ----
export type LeaveType = 'Casual' | 'Sick' | 'Earned' | 'Unpaid' | 'Other';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ILeave {
  _id: string;
  user_id: IUser | string;
  company_id: string;
  from_date: string;
  to_date: string;
  reason: string;
  leave_type: LeaveType;
  status: LeaveStatus;
  approved_by?: IUser | string;
  createdAt?: string;
}

// ---- Holiday ----
export type HolidayType = 'Public' | 'Company' | 'Optional';

export interface IHoliday {
  _id: string;
  company_id: string;
  date: string;
  name: string;
  type: HolidayType;
  createdAt?: string;
}

// ---- Leave Balance ----
export interface LeaveBalanceEntry {
  total: number;
  used: number;
  remaining: number;
}

export interface ILeaveBalance {
  _id: string;
  user_id: string;
  company_id: string;
  year: number;
  balances: {
    casual: LeaveBalanceEntry;
    sick: LeaveBalanceEntry;
    earned: LeaveBalanceEntry;
    unpaid: LeaveBalanceEntry;
  };
}

// ---- API Response Types ----
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

// ---- Daily Summary ----
export interface DailySummary {
  total_users: number;
  present: number;
  late: number;
  half_day: number;
  early_departure: number;
  on_leave: number;
  absent: number;
  not_checked_in: Array<{ name: string; email: string; department?: string; role: string }>;
  late_arrivals: Array<{ name: string; email: string; late_by: number; check_in: string }>;
  checked_out: Array<{ name: string; work_hours: number }>;
}

// ---- Monthly Calendar ----
export interface MonthlyCalendarDay {
  date: string;
  status: AttendanceStatus | null;
  check_in?: string;
  check_out?: string;
  work_hours?: number;
  is_late?: boolean;
  late_minutes?: number;
  is_overtime?: boolean;
  mode?: AttendanceMode;
  holiday_name?: string;
  is_today?: boolean;
}

// ---- Reports ----
export interface AttendanceReportRow {
  user_id: string;
  name: string;
  email: string;
  department: string;
  total_working_days: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  on_leave: number;
  overtime_hours: number;
  avg_work_hours: number;
  total_work_hours: number;
  attendance_percentage: number;
}

export interface AttendanceReportSummary {
  period: string;
  total_working_days: number;
  avg_attendance_pct: number;
  total_overtime_hours: number;
  most_late: Array<{ name: string; count: number }>;
  department_breakdown: Array<{
    department: string;
    total: number;
    avg_attendance_pct: number;
    avg_work_hours: number;
  }>;
  rows: AttendanceReportRow[];
}

// ---- Today Status (User) ----
export interface TodayStatusData {
  checked_in: boolean;
  checked_out: boolean;
  check_in_time?: string;
  check_out_time?: string;
  is_late?: boolean;
  late_minutes?: number;
  work_hours?: number;
  shift_start: string;
  shift_end: string;
  allow_self_checkin: boolean;
  attendance_mode: string;
}

// ---- Form Data Types ----
export interface OnboardFormData {
  companyName: string;
  plan: 'Free' | 'Paid';
  org_type: OrgType;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface UserRegistrationFormData {
  name: string;
  email: string;
  password: string;
  role: 'User' | 'Admin';
  department: string;
  employee_id?: string;
  designation?: string;
  roll_number?: string;
  class_name?: string;
  section?: string;
}

export interface LeaveApplicationFormData {
  from_date: string;
  to_date: string;
  reason: string;
  leave_type: LeaveType;
}
