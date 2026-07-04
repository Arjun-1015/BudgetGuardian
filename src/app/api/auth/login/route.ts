import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { identifier, password } = parsed.data;

  const user = await db.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  });

  // Same generic error whether the account doesn't exist or the password
  // is wrong, so login attempts can't be used to enumerate accounts.
  const genericError = NextResponse.json({ error: "Incorrect email/username or password" }, { status: 401 });

  if (!user) return genericError;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return genericError;

  if (user.isSuspended) {
    return NextResponse.json({ error: "This account has been suspended. Contact support." }, { status: 403 });
  }

  await setSessionCookie(user.id);

  return NextResponse.json({ id: user.id, name: user.name, onboarded: Boolean(user.onboardedAt) });
}
