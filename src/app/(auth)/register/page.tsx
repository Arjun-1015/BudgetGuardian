"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(form) });
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="mb-1 font-display text-2xl text-ink dark:text-mist">Create your account</h1>
      <p className="mb-6 text-sm text-ink-soft dark:text-mist/60">Takes about a minute.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Full name" value={form.name} onChange={update("name")} required />
        <Input label="Username" value={form.username} onChange={update("username")} autoComplete="username" required />
        <Input label="Email" type="email" value={form.email} onChange={update("email")} autoComplete="email" required />
        <Input
          label="Password"
          type="password"
          value={form.password}
          onChange={update("password")}
          autoComplete="new-password"
          minLength={8}
          required
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" loading={loading} className="mt-2">
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-soft dark:text-mist/60">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand">
          Log in
        </Link>
      </p>
    </>
  );
}
