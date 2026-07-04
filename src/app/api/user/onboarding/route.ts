import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/require-user";
import { profileSchema, dependentSchema } from "@/lib/validation";
import { z } from "zod";

const onboardingSchema = z.object({
  profile: profileSchema,
  dependents: z.array(dependentSchema).default([]),
});

export async function POST(req: NextRequest) {
  const { userId, unauthorized } = await requireUserId();
  if (unauthorized) return unauthorized;

  const body = await req.json().catch(() => null);
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { profile, dependents } = parsed.data;

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { ...profile, onboardedAt: new Date() },
    }),
    db.dependent.deleteMany({ where: { userId } }),
    ...(dependents.length
      ? [db.dependent.createMany({ data: dependents.map((d) => ({ ...d, userId })) })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
