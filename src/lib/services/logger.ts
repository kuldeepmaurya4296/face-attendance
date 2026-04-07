/**
 * ============================================================
 * Structured Logger — Centralized Logging Service
 * ============================================================
 * 
 * Provides structured JSON logging for:
 * - Attendance events (check-in, check-out, early exit)
 * - ML service events (match, failure, liveness)
 * - Security events (auth failure, rate limit, tenant violation)
 * - General application events
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  event: string;
  data?: Record<string, any>;
  user_id?: string;
  company_id?: string;
  ip?: string;
}

function formatLog(entry: LogEntry): string {
  return JSON.stringify(entry);
}

function log(level: LogLevel, category: string, event: string, data?: Record<string, any>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    event,
    ...data && { data },
  };

  const formatted = formatLog(entry);

  switch (level) {
    case 'error':
      console.error(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatted);
      }
      break;
    default:
      console.log(formatted);
  }
}

// ─── Attendance Events ───────────────────────────────────

export const attendanceLog = {
  checkIn: (userId: string, companyId: string, isLate: boolean, lateMinutes: number) =>
    log('info', 'attendance', 'CHECK_IN', { user_id: userId, company_id: companyId, is_late: isLate, late_minutes: lateMinutes }),

  checkOut: (userId: string, companyId: string, workHours: number, status: string, isValidCheckout: boolean) =>
    log('info', 'attendance', 'CHECK_OUT', { user_id: userId, company_id: companyId, work_hours: workHours, status, is_valid_checkout: isValidCheckout }),

  earlyExit: (userId: string, companyId: string, workHours: number, minRequired: number) =>
    log('warn', 'attendance', 'EARLY_EXIT', { user_id: userId, company_id: companyId, work_hours: workHours, min_required: minRequired }),

  doubleCheckIn: (userId: string, companyId: string) =>
    log('warn', 'attendance', 'DOUBLE_CHECK_IN_ATTEMPT', { user_id: userId, company_id: companyId }),

  alreadyCompleted: (userId: string, companyId: string) =>
    log('info', 'attendance', 'ALREADY_COMPLETED', { user_id: userId, company_id: companyId }),
};

// ─── ML Service Events ──────────────────────────────────

export const mlLog = {
  searchSuccess: (userId: string, confidence?: number) =>
    log('info', 'ml', 'FACE_SEARCH_MATCH', { user_id: userId, confidence }),

  searchFailed: (reason: string) =>
    log('warn', 'ml', 'FACE_SEARCH_NO_MATCH', { reason }),

  livenessFailed: () =>
    log('warn', 'ml', 'LIVENESS_FAILED', {}),

  duplicateDetected: (existingUserId: string) =>
    log('warn', 'ml', 'DUPLICATE_FACE_DETECTED', { existing_user_id: existingUserId }),

  serviceError: (error: string) =>
    log('error', 'ml', 'ML_SERVICE_ERROR', { error }),
};

// ─── Security Events ────────────────────────────────────

export const securityLog = {
  authFailure: (reason: string, ip?: string) =>
    log('warn', 'security', 'AUTH_FAILURE', { reason, ip }),

  rateLimitHit: (ip: string, endpoint: string) =>
    log('warn', 'security', 'RATE_LIMIT_HIT', { ip, endpoint }),

  tenantViolation: (userId: string, attemptedCompanyId: string, actualCompanyId: string) =>
    log('error', 'security', 'TENANT_VIOLATION', { user_id: userId, attempted_company_id: attemptedCompanyId, actual_company_id: actualCompanyId }),

  invalidInput: (endpoint: string, errors: string[]) =>
    log('warn', 'security', 'INVALID_INPUT', { endpoint, errors }),
};

// ─── General ─────────────────────────────────────────────

export const appLog = {
  info: (event: string, data?: Record<string, any>) => log('info', 'app', event, data),
  warn: (event: string, data?: Record<string, any>) => log('warn', 'app', event, data),
  error: (event: string, data?: Record<string, any>) => log('error', 'app', event, data),
  debug: (event: string, data?: Record<string, any>) => log('debug', 'app', event, data),
};
