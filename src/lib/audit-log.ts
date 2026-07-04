import { db } from "./db";

/** Records an admin action for the activity log. Fire-and-forget from the
 * caller's perspective — a logging failure shouldn't block the actual
 * admin action, so this never throws (errors are swallowed after being
 * logged to the server console). */
export async function logAdminAction(params: {
  adminId: string;
  adminName: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
}) {
  try {
    await db.auditLog.create({
      data: {
        adminId: params.adminId,
        adminName: params.adminName,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        details: params.details,
      },
    });
  } catch (err) {
    console.error("[audit-log] Failed to record admin action:", err);
  }
}
