import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/require-user";
import { getDashboardSummary } from "@/lib/dashboard-summary";

export async function GET() {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const summary = await getDashboardSummary(userId);
  if (!summary) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json(summary);
}
