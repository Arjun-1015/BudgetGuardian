import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminDashboard } from "@/components/admin-dashboard";

export default async function AdminPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const me = await db.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  if (!me?.isAdmin) redirect("/dashboard");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl text-ink dark:text-mist">Admin</h1>
        <p className="text-sm text-ink-soft dark:text-mist/60">
          Manage users, view platform analytics, publish announcements, and review admin activity.
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
