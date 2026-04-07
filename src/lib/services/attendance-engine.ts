/**
 * ============================================================
 * Attendance Engine — Centralized Pure-Function Service
 * ============================================================
 * 
 * All attendance status logic lives here.
 * This module is:
 *   - Pure (no DB calls, no side effects)
 *   - Reusable (backend API routes call this)
 *   - Fully testable
 * 
 * Handles: Late detection, Half-day, Full-day, Early exit,
 *          Overtime, Minimum work hours validation.
 */

import type {
  AttendanceEngineConfig,
  AttendanceStatus,
  CheckInResult,
  CheckOutResult,
  OrgType,
} from '@/types';

// ─── Helpers ─────────────────────────────────────────────

/** Parse "HH:MM" string into { hours, minutes } */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(':').map(Number);
  return { hours: h || 0, minutes: m || 0 };
}

/** Create a Date object for today at the given HH:MM */
function todayAt(timeStr: string, referenceDate?: Date): Date {
  const { hours, minutes } = parseTime(timeStr);
  const d = referenceDate ? new Date(referenceDate) : new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Round to 2 decimal places */
function round2(n: number): number {
  return parseFloat(n.toFixed(2));
}

// ─── Check-In Logic ──────────────────────────────────────

/**
 * Determine status at check-in time.
 * 
 * @param checkInTime - The actual check-in timestamp
 * @param config      - Company attendance configuration
 * @returns CheckInResult with status, late flag, late minutes
 */
export function computeCheckIn(
  checkInTime: Date,
  config: AttendanceEngineConfig
): CheckInResult {
  const { hours: startH, minutes: startM } = parseTime(config.shift_start);
  
  // Threshold time = shift_start + late_threshold_minutes
  const thresholdTime = new Date(checkInTime);
  thresholdTime.setHours(startH, startM + config.late_threshold_minutes, 0, 0);

  const isLate = checkInTime > thresholdTime;

  let lateMinutes = 0;
  if (isLate) {
    const shiftStartTime = new Date(checkInTime);
    shiftStartTime.setHours(startH, startM, 0, 0);
    lateMinutes = Math.round((checkInTime.getTime() - shiftStartTime.getTime()) / 60000);
  }

  return {
    status: isLate ? 'Late' : 'Present',
    is_late: isLate,
    late_minutes: lateMinutes,
  };
}

// ─── Check-Out Logic ─────────────────────────────────────

/**
 * Determine final status at check-out time.
 * 
 * Handles:
 * - Work hours calculation
 * - Minimum checkout hours validation (Early-Exit)
 * - Full-day / Half-day / Early-Departure classification
 * - Overtime detection (company only, not institute)
 * - Early departure detection (left before shift end)
 * 
 * @param checkInTime  - The original check-in timestamp
 * @param checkOutTime - The check-out timestamp
 * @param wasLate      - Whether the check-in was marked late
 * @param config       - Company attendance configuration
 * @returns CheckOutResult
 */
export function computeCheckOut(
  checkInTime: Date,
  checkOutTime: Date,
  wasLate: boolean,
  config: AttendanceEngineConfig
): CheckOutResult {
  // 1. Calculate work hours
  const workMs = checkOutTime.getTime() - checkInTime.getTime();
  const workHours = round2(workMs / 3600000);

  // 2. Check minimum checkout hours
  const minHours = config.min_checkout_hours ?? 3;
  const isValidCheckout = workHours >= minHours;

  let status: AttendanceStatus;
  let earlyExitReason = '';

  if (!isValidCheckout) {
    // Below minimum hours — mark as Early-Exit
    status = 'Early-Exit';
    earlyExitReason = `Checked out after ${workHours.toFixed(1)}h (minimum ${minHours}h required)`;
  } else if (workHours >= config.full_day_hours) {
    // Full day
    status = wasLate ? 'Late' : 'Present';
  } else if (workHours >= config.half_day_hours) {
    // Half day
    status = 'Half-Day';
  } else {
    // Below half-day but above minimum
    status = 'Early-Departure';
  }

  // 3. Early departure detection (before shift end - threshold)
  const { hours: endH, minutes: endM } = parseTime(config.shift_end);
  const shiftEndThreshold = new Date(checkOutTime);
  shiftEndThreshold.setHours(endH, endM - config.early_departure_threshold_minutes, 0, 0);

  let isEarlyDeparture = false;
  let earlyDepartureMinutes = 0;

  if (checkOutTime < shiftEndThreshold && isValidCheckout) {
    isEarlyDeparture = true;
    const earlyMs = shiftEndThreshold.getTime() - checkOutTime.getTime();
    earlyDepartureMinutes = Math.round(earlyMs / 60000);
  }

  // 4. Overtime detection (companies only, not institutes)
  let isOvertime = false;
  let overtimeHours = 0;

  if (config.org_type !== 'Institute' && workHours > config.overtime_threshold_hours) {
    isOvertime = true;
    overtimeHours = round2(workHours - config.overtime_threshold_hours);
  }

  return {
    status,
    work_hours: workHours,
    is_overtime: isOvertime,
    overtime_hours: overtimeHours,
    is_early_departure: isEarlyDeparture,
    early_departure_minutes: earlyDepartureMinutes,
    is_valid_checkout: isValidCheckout,
    early_exit_reason: earlyExitReason,
  };
}

// ─── Can Checkout Check ──────────────────────────────────

/**
 * Check if enough time has elapsed for a valid checkout.
 * Used by frontend to show "Too Early to Checkout" state.
 * 
 * @returns Object with can_checkout flag and remaining minutes
 */
export function canCheckout(
  checkInTime: Date,
  currentTime: Date,
  minCheckoutHours: number
): { can_checkout: boolean; remaining_minutes: number } {
  const elapsedMs = currentTime.getTime() - checkInTime.getTime();
  const elapsedHours = elapsedMs / 3600000;
  const remainingMs = (minCheckoutHours * 3600000) - elapsedMs;
  const remainingMinutes = Math.max(0, Math.ceil(remainingMs / 60000));

  return {
    can_checkout: elapsedHours >= minCheckoutHours,
    remaining_minutes: remainingMinutes,
  };
}

// ─── Build Config from Company Settings ──────────────────

/**
 * Build an AttendanceEngineConfig from raw company data.
 * Falls back to sensible defaults for every field.
 */
export function buildConfig(
  settings: Record<string, any>,
  orgType: string
): AttendanceEngineConfig {
  return {
    shift_start: settings?.shift_start || '09:00',
    shift_end: settings?.shift_end || '18:00',
    late_threshold_minutes: settings?.late_threshold_minutes ?? 15,
    early_departure_threshold_minutes: settings?.early_departure_threshold_minutes ?? 15,
    full_day_hours: settings?.full_day_hours ?? 8,
    half_day_hours: settings?.half_day_hours ?? 4,
    overtime_threshold_hours: settings?.overtime_threshold_hours ?? 9,
    min_checkout_hours: settings?.min_checkout_hours ?? 3,
    weekend_days: settings?.weekend_days ?? [0, 6],
    org_type: (orgType as OrgType) || 'Company',
  };
}

// ─── Generate Checkout Message ───────────────────────────

/**
 * Generate a human-friendly message for checkout.
 */
export function checkoutMessage(
  userName: string,
  result: CheckOutResult,
  orgType: OrgType
): string {
  if (!result.is_valid_checkout) {
    return `⚠️ Early Exit, ${userName}! Only ${result.work_hours.toFixed(1)}h worked — marked as Early Exit.`;
  }

  const prefix = orgType === 'Institute'
    ? `Goodbye, ${userName}! Attended for`
    : `Goodbye, ${userName}! Worked`;

  let suffix = `${result.work_hours.toFixed(1)}h today`;

  if (result.is_overtime) {
    suffix += ` (${result.overtime_hours.toFixed(1)}h overtime)`;
  }

  return `${prefix} ${suffix}`;
}
