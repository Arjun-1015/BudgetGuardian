import { NextResponse } from "next/server";
import { getSessionUserId } from "./auth";
import { db } from "./db";

/** Returns the authenticated user's id, or writes a 401 response and
 * returns null. Callers should `return` immediately when they get null. */
export async function requireUserId(): Promise<
  { userId: string; unauthorized: null } | { userId: null; unauthorized: NextResponse }
> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { userId: null, unauthorized: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  return { userId, unauthorized: null };
}

/** Same as requireUserId, but also checks the isAdmin flag. Used to gate
 * the admin panel API routes. Returns the admin's name too, since most
 * admin routes need it for the audit log. */
export async function requireAdminId(): Promise<
  | { userId: string; adminName: string; unauthorized: null }
  | { userId: null; adminName: null; unauthorized: NextResponse }
> {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return { userId: null, adminName: null, unauthorized };

  const user = await db.user.findUnique({ where: { id: userId }, select: { isAdmin: true, name: true } });
  if (!user?.isAdmin) {
    return { userId: null, adminName: null, unauthorized: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userId, adminName: user.name, unauthorized: null };
}
