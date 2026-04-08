/**
 * ============================================================
 * Input Validators — Zod Schema Validation
 * ============================================================
 * 
 * Centralized input validation for all API endpoints.
 * Every request body is validated before processing.
 */

import { z } from 'zod';

// ─── Attendance ──────────────────────────────────────────

export const markAttendanceSchema = z.object({
  user_id: z.string().min(1, 'user_id is required'),
  company_id: z.string().min(1, 'company_id is required'),
  mode: z.enum(['SELF', 'KIOSK', 'MANUAL'], { message: 'mode must be SELF, KIOSK, or MANUAL' }),
});

// ─── Auth ────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const registerUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email format').trim().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Admin', 'User']).optional().default('User'),
  face_embeddings: z.array(z.number()).optional(),
  phone: z.string().optional(),
  // Company fields
  employee_id: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
  joining_date: z.string().optional(),
  // Institute fields
  roll_number: z.string().optional(),
  class_name: z.string().optional(),
  section: z.string().optional(),
  enrollment_year: z.number().optional(),
  parent_phone: z.string().optional(),
  face_image: z.string().optional(),
});

// ─── Company Settings ────────────────────────────────────

export const companySettingsSchema = z.object({
  settings: z.object({
    attendance_mode: z.enum(['SELF', 'KIOSK', 'BOTH']).optional(),
    allow_self_checkin: z.boolean().optional(),
    shift_start: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format').optional(),
    shift_end: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:MM format').optional(),
    late_threshold_minutes: z.number().min(0).max(120).optional(),
    early_departure_threshold_minutes: z.number().min(0).max(120).optional(),
    full_day_hours: z.number().min(1).max(24).optional(),
    half_day_hours: z.number().min(0.5).max(12).optional(),
    overtime_threshold_hours: z.number().min(1).max(24).optional(),
    weekend_days: z.array(z.number().min(0).max(6)).optional(),
    auto_checkout_time: z.string().optional(),
    theme: z.enum(['Aura', 'Midnight', 'Emerald', 'Oceanic', 'Sunset']).optional(),
    min_checkout_hours: z.number().min(0).max(12).optional(),
  }).optional(),
  admin_permissions: z.object({
    manage_personnel: z.boolean().optional(),
    approve_leaves: z.boolean().optional(),
    view_attendance: z.boolean().optional(),
    manage_settings: z.boolean().optional(),
    manage_holidays: z.boolean().optional(),
  }).optional(),
});

// ─── Onboarding ──────────────────────────────────────────

export const onboardSchema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200),
  plan: z.enum(['Free', 'Paid']).optional().default('Free'),
  org_type: z.enum(['Company', 'Institute']),
  adminName: z.string().min(1, 'Admin name is required').max(100),
  adminEmail: z.string().email('Invalid admin email'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// ─── Leave ───────────────────────────────────────────────

export const leaveSchema = z.object({
  from_date: z.string().min(1, 'From date is required'),
  to_date: z.string().min(1, 'To date is required'),
  reason: z.string().min(1, 'Reason is required').max(500),
  leave_type: z.enum(['Casual', 'Sick', 'Earned', 'Unpaid', 'Other']).optional().default('Casual'),
});

export const leaveActionSchema = z.object({
  status: z.enum(['Approved', 'Rejected']),
});

// ─── Holiday ─────────────────────────────────────────────

export const holidaySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  name: z.string().min(1, 'Holiday name is required').max(200),
  type: z.enum(['Public', 'Company', 'Optional']).optional().default('Company'),
});

// ─── Helper: Validate & Return ───────────────────────────

/**
 * Validate request body against a Zod schema.
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map(issue => 
    `${issue.path.join('.')}: ${issue.message}`
  );
  return { success: false, errors };
}

/**
 * Sanitize a string to prevent XSS / injection.
 */
export function sanitize(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
