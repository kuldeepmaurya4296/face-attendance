/**
 * ============================================================
 * Tenant Isolation — Multi-tenant Security Middleware
 * ============================================================
 * 
 * Ensures strict company_id scoping on every request.
 * Prevents cross-tenant data leakage.
 */

import { securityLog } from '@/lib/services/logger';

/**
 * Validate that a user can access data for the given company_id.
 * Owner can access any company. All other roles must match exactly.
 * 
 * @returns true if access is allowed, false if violated
 */
export function validateTenantAccess(
  user: { _id: string; role: string; company_id?: string },
  requestedCompanyId: string
): boolean {
  // Owner has cross-tenant access
  if (user.role === 'Owner') return true;

  // All other roles must match their own company
  if (!user.company_id || user.company_id.toString() !== requestedCompanyId.toString()) {
    securityLog.tenantViolation(
      user._id?.toString(),
      requestedCompanyId,
      user.company_id?.toString() || 'none'
    );
    return false;
  }

  return true;
}

/**
 * Get the effective company_id for a request.
 * For non-Owner users, always returns their own company_id.
 * For Owner, uses the requested company_id if provided, otherwise returns null.
 */
export function getEffectiveCompanyId(
  user: { role: string; company_id?: string },
  requestedCompanyId?: string
): string | null {
  if (user.role === 'Owner') {
    return requestedCompanyId || null;
  }
  return user.company_id?.toString() || null;
}

/**
 * Ensure a user_id belongs to the given company.
 * Used when marking attendance to prevent cross-tenant actions.
 */
export async function validateUserBelongsToCompany(
  userId: string,
  companyId: string,
  UserModel: any
): Promise<boolean> {
  const user = await UserModel.findOne({
    _id: userId,
    company_id: companyId,
    status: 'Active'
  }).select('_id');

  return !!user;
}
