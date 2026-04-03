import Company from '@/models/Company';
import connectDB from './db';

export type PermissionKey = 'manage_personnel' | 'approve_leaves' | 'view_attendance' | 'manage_settings' | 'manage_holidays';

/**
 * Check if a user has a specific admin permission.
 * Owner and SuperAdmin always have all permissions.
 * Admin permissions are controlled by the SuperAdmin via company.admin_permissions.
 * User role never has admin permissions.
 */
export async function checkAdminPermission(
  user: any,
  permission: PermissionKey
): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'Owner' || user.role === 'SuperAdmin') return true;
  if (user.role !== 'Admin') return false;

  await connectDB();
  const company = await Company.findById(user.company_id);
  if (!company) return false;

  return company.admin_permissions?.[permission] ?? false;
}

/**
 * Get all admin permissions for a company.
 */
export async function getAdminPermissions(companyId: string) {
  await connectDB();
  const company = await Company.findById(companyId);
  return company?.admin_permissions ?? {
    manage_personnel: true,
    approve_leaves: true,
    view_attendance: true,
    manage_settings: false,
    manage_holidays: false,
  };
}
